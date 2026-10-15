import type * as Kit from "@prosary/kit";
import type { NuxtProsaryConfig } from "../../src/config";

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const kit = vi.hoisted(() => ({
  addTemplate: vi.fn(),
  addPlugin: vi.fn(),
  addImports: vi.fn(),
  addServerHandler: vi.fn(),
  createResolver: vi.fn(() => ({ resolve: (p: string) => `/resolved${p}` })),
  directoryToURL: vi.fn((dir: string) => new URL(`file://${dir}/`)),
  tryResolveModule: vi.fn(
    async (_id: string, _url: URL): Promise<string | undefined> => undefined,
  ),
}));

const logger = vi.hoisted(() => ({ info: vi.fn(), warn: vi.fn() }));

vi.mock("@nuxt/kit", () => ({
  defineNuxtModule: (def: unknown) => def,
  useLogger: () => logger,
  ...kit,
}));

/*
 * The kit's own tests exercise loading and building; here both are stubbed so
 * the module's build runs without documents. The kit's `emit` is the real
 * one: the module's templates are whatever the kit generates.
 */
const built = vi.hoisted(() => ({
  locale: "en",
  locales: ["en", "fr"],
  formats: { number: {}, date: {}, time: {} },
  messages: { title: { arguments: {}, source: "Welcome" } },
  bundles: {
    en: { title: [{ type: 0, value: "Welcome" }] },
    fr: { title: [{ type: 0, value: "Bienvenue" }] },
  },
  documents: ["intro.md"],
  output: "hast",
  elements: [],
  directives: [],
  content: {
    en: { "intro.md": '{"type":"root","children":[]}\n' },
    fr: { "intro.md": '{"type":"root","children":[],"lang":"fr"}\n' },
  },
  outDir: "prosary",
  coverage: {},
  inputs: ["/app/messages.json", "/app/translations/fr.json"],
}));

vi.mock("@prosary/kit", async (original) => ({
  ...(await original<typeof Kit>()),
  loadConfig: vi.fn(async () => ({
    messages: "messages.json",
    translate: { source: "en" },
  })),
  resolveKit: vi.fn(async () => built),
  translate: vi.fn(async () => ({})),
}));

import { loadConfig, resolveKit, translate } from "@prosary/kit";
import module from "../../src/module";

interface FakeNuxt {
  options: {
    rootDir: string;
    buildDir: string;
    _prepare?: boolean;
    dev?: boolean;
    watch: string[];
    nitro: {
      publicAssets?: {
        dir: string;
        baseURL: string;
        maxAge: number;
        fallthrough: boolean;
      }[];
      serverAssets?: { baseName: string; dir: string }[];
    };
  };
}

interface ModuleDef {
  meta: { name: string; configKey: string };
  setup: (options: NuxtProsaryConfig, nuxt: FakeNuxt) => Promise<void>;
}
const mod = module as unknown as ModuleDef;

const nuxt = (rootDir = "/app"): FakeNuxt => ({
  options: { rootDir, buildDir: `${rootDir}/.nuxt`, watch: [], nitro: {} },
});

/** The registered templates, by filename. */
const templates = () =>
  Object.fromEntries(
    kit.addTemplate.mock.calls.map(([entry]) => [
      (entry as { filename: string }).filename,
      entry as { write?: boolean; getContents: () => string },
    ]),
  );

describe("prosary module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is named prosary and configured under prosary", () => {
    expect(mod.meta).toEqual({ name: "prosary", configKey: "prosary" });
  });

  it("builds the app's own kit config", async () => {
    await mod.setup({}, nuxt());
    expect(loadConfig).toHaveBeenCalledWith("/app/prosary.config.ts");
    expect(resolveKit).toHaveBeenCalledWith(expect.anything(), { cwd: "/app" });
  });

  it("builds the config it is pointed at", async () => {
    await mod.setup({ config: "lang/prosary.config.ts" }, nuxt());
    expect(loadConfig).toHaveBeenCalledWith("/app/lang/prosary.config.ts");
  });

  it("watches the config and every file the build read", async () => {
    const app = nuxt();
    await mod.setup({}, app);
    expect(app.options.watch).toEqual([
      "/app/prosary.config.ts",
      "/app/messages.json",
      "/app/translations/fr.json",
    ]);
  });

  it("writes the kit's output as build templates under prosary/", async () => {
    await mod.setup({}, nuxt());
    const written = templates();
    expect(Object.keys(written)).toEqual([
      "prosary/index.mjs",
      "prosary/index.d.mts",
      "prosary/bundles.mjs",
      "prosary/bundles.d.mts",
      "prosary/messages/en.mjs",
      "prosary/messages/fr.mjs",
      "prosary/content/en/intro.json",
      "prosary/content/fr/intro.json",
    ]);
    expect(Object.values(written).every((entry) => entry.write)).toBe(true);
    expect(written["prosary/messages/fr.mjs"]!.getContents()).toBe(
      `export default ${JSON.stringify(built.bundles.fr)};\n`,
    );
    expect(written["prosary/index.d.mts"]!.getContents()).toContain(
      'export type Locale =\n  | "en"\n  | "fr";',
    );
    expect(written["prosary/content/fr/intro.json"]!.getContents()).toBe(
      '{"type":"root","children":[],"lang":"fr"}\n',
    );
  });

  it("serves the built content documents as static files", async () => {
    const app = nuxt();
    await mod.setup({}, app);
    expect(app.options.nitro.publicAssets).toEqual([
      {
        dir: "/app/.nuxt/prosary/content",
        baseURL: "/_prosary/content",
        maxAge: 0,
        fallthrough: true,
      },
    ]);
  });

  it("serves the content from a handler of its own as well, in development", async () => {
    const app = nuxt();
    await mod.setup({}, app);
    expect(app.options.nitro.serverAssets).toBeUndefined();
    expect(kit.addServerHandler).not.toHaveBeenCalled();
    const dev = { ...nuxt(), options: { ...nuxt().options, dev: true } };
    await mod.setup({}, dev);
    expect(dev.options.nitro.serverAssets).toEqual([
      { baseName: "prosary", dir: "/app/.nuxt/prosary/content" },
    ]);
    expect(kit.addServerHandler).toHaveBeenCalledWith({
      route: "/_prosary/content/**",
      handler: "/resolved./runtime/server/content",
    });
  });

  it("serves no content for an app that has none", async () => {
    vi.mocked(resolveKit).mockResolvedValueOnce({
      ...built,
      documents: [],
      content: { en: {}, fr: {} },
    } as never);
    const app = nuxt();
    await mod.setup({}, app);
    expect(app.options.nitro.publicAssets).toBeUndefined();
  });

  it("translates nothing unless it is given how", async () => {
    await mod.setup({}, nuxt());
    expect(translate).not.toHaveBeenCalled();
  });

  it("translates before it builds when given how", async () => {
    const order: string[] = [];
    vi.mocked(translate).mockImplementationOnce(async () => {
      order.push("translate");
      return {};
    });
    vi.mocked(resolveKit).mockImplementationOnce(async () => {
      order.push("build");
      return built as never;
    });
    const options = { model: "test/model", instructions: "Be brief." };
    await mod.setup({ translate: options }, nuxt());
    expect(translate).toHaveBeenCalledWith({
      root: "/app",
      config: "/app/prosary.config.ts",
      translate: options,
    });
    expect(order).toEqual(["translate", "build"]);
  });

  it("says what it translated, and warns of what did not hold", async () => {
    vi.mocked(translate).mockResolvedValueOnce({
      fr: {
        written: ["title"],
        rejected: { terms: ['takes "x", which the source message does not'] },
        skipped: ["invite"],
        kept: ["greeting"],
        pending: [],
        documents: { written: ["intro.md"], rejected: {}, pending: [] },
      },
    });
    await mod.setup({ translate: { model: "test/model" } }, nuxt());
    expect(logger.info).toHaveBeenCalledWith(
      "fr: translated 1 messages and 1 documents",
    );
    expect(logger.warn.mock.calls.map(([line]) => line as string)).toEqual([
      expect.stringContaining('"terms" was rejected'),
      expect.stringContaining('"invite" came back with no translation'),
      expect.stringContaining('"greeting" was written by hand'),
    ]);
  });

  it("does not translate while preparing", async () => {
    const app = nuxt();
    app.options._prepare = true;
    await mod.setup({ translate: { model: "test/model" } }, app);
    expect(translate).not.toHaveBeenCalled();
    expect(resolveKit).toHaveBeenCalled();
  });

  it("fails the build when the model fails", async () => {
    const failure = new Error("no API key");
    vi.mocked(translate).mockRejectedValueOnce(failure);
    await expect(
      mod.setup({ translate: { model: "test/model" } }, nuxt()),
    ).rejects.toBe(failure);
    expect(resolveKit).not.toHaveBeenCalled();
  });

  it("registers the runtime plugin", async () => {
    await mod.setup({}, nuxt());
    expect(kit.addPlugin).toHaveBeenCalledWith({
      src: "/resolved./runtime/plugin",
    });
  });

  it("auto-imports the composables, the store and the app types", async () => {
    await mod.setup({}, nuxt());
    const imports = kit.addImports.mock.calls[0]?.[0] as {
      name: string;
      from: string;
      type?: boolean;
    }[];
    expect(
      imports.filter((entry) => !entry.type).map((entry) => entry.name),
    ).toEqual([
      "useProsary",
      "useT",
      "useLocale",
      "useDocument",
      "accessProsary",
    ]);
    expect(
      imports.filter((entry) => entry.type).map((entry) => entry.name),
    ).toContain("AppProsaryLocale");
  });

  it("fails the build when the kit rejects the messages", async () => {
    const failure = new Error("the messages are invalid");
    vi.mocked(resolveKit).mockRejectedValueOnce(failure);
    await expect(mod.setup({}, nuxt())).rejects.toBe(failure);
    expect(kit.addTemplate).not.toHaveBeenCalled();
  });
});

describe("prosary module, over a build made elsewhere", () => {
  let root: string;
  let built: string;

  /** Writes a kit build's modules — and its content, when asked — to disk. */
  const write = async (content: boolean, output: unknown = "hast") => {
    await mkdir(built, { recursive: true });
    await writeFile(
      join(built, "index.mjs"),
      `export const locale = "en";\nexport const content = Object.freeze({ output: ${JSON.stringify(output)} });\n`,
    );
    await writeFile(join(built, "bundles.mjs"), "export const bundles = {};\n");
    if (content) {
      await mkdir(join(built, "content/en"), { recursive: true });
      await writeFile(
        join(built, "content/en/intro.json"),
        '{"type":"root","children":[]}\n',
      );
    }
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    root = await mkdtemp(join(tmpdir(), "prosary-nuxt-"));
    built = join(root, "messages/prosary");
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("re-exports the build's modules instead of building", async () => {
    await write(false);
    const app = nuxt(join(root, "app"));
    await mod.setup({ build: "../messages/prosary" }, app);
    expect(loadConfig).not.toHaveBeenCalled();
    expect(resolveKit).not.toHaveBeenCalled();
    expect(app.options.watch).toEqual([]);

    const written = templates();
    expect(Object.keys(written)).toEqual([
      "prosary/index.mjs",
      "prosary/index.d.mts",
      "prosary/bundles.mjs",
      "prosary/bundles.d.mts",
    ]);
    const index = `export * from ${JSON.stringify(join(built, "index.mjs"))};\n`;
    expect(written["prosary/index.mjs"]!.getContents()).toBe(index);
    expect(written["prosary/index.d.mts"]!.getContents()).toBe(index);
    expect(written["prosary/bundles.mjs"]!.getContents()).toBe(
      `export * from ${JSON.stringify(join(built, "bundles.mjs"))};\n`,
    );
  });

  it("takes the build over the app's own config, and translates nothing", async () => {
    await write(false);
    await mod.setup(
      {
        build: built,
        config: "prosary.config.ts",
        translate: { model: "test/model" },
      },
      nuxt(join(root, "app")),
    );
    expect(loadConfig).not.toHaveBeenCalled();
    expect(translate).not.toHaveBeenCalled();
  });

  it("finds the build of a package by its main entry", async () => {
    await write(false);
    kit.tryResolveModule.mockResolvedValueOnce(
      pathToFileURL(join(built, "index.mjs")).href,
    );
    const app = nuxt(join(root, "app"));
    await mod.setup({ build: "@acme/messages" }, app);
    expect(kit.tryResolveModule).toHaveBeenCalledWith(
      "@acme/messages",
      new URL(`file://${app.options.rootDir}/`),
    );
    expect(templates()["prosary/index.mjs"]!.getContents()).toContain(
      JSON.stringify(join(built, "index.mjs")),
    );
  });

  it("serves the build's content documents from where they stand", async () => {
    await write(true);
    const app = nuxt(join(root, "app"));
    await mod.setup({ build: built }, app);
    expect(app.options.nitro.publicAssets).toEqual([
      {
        dir: join(built, "content"),
        baseURL: "/_prosary/content",
        maxAge: 0,
        fallthrough: true,
      },
    ]);
  });

  it("serves no content for a build that has none", async () => {
    await write(false);
    const app = nuxt(join(root, "app"));
    await mod.setup({ build: built }, app);
    expect(app.options.nitro.publicAssets).toBeUndefined();
  });

  it("fails when the build cannot be found", async () => {
    await expect(
      mod.setup({ build: "@acme/messages" }, nuxt(join(root, "app"))),
    ).rejects.toThrow('`build` "@acme/messages" could not be found');
    await expect(
      mod.setup({ build: "../nowhere" }, nuxt(join(root, "app"))),
    ).rejects.toThrow("could not be found");
  });

  it("fails when the location holds no kit build", async () => {
    await mkdir(built, { recursive: true });
    await expect(
      mod.setup({ build: built }, nuxt(join(root, "app"))),
    ).rejects.toThrow("is not a kit build — it has no index.mjs");
    expect(kit.addTemplate).not.toHaveBeenCalled();
  });

  it("refuses content built in another form, or by a build too old to say", async () => {
    await write(true, "md");
    await expect(
      mod.setup({ build: "../messages/prosary" }, nuxt(join(root, "app"))),
    ).rejects.toThrow(
      'the content must be built as "hast", which the module renders — the build at ',
    );
    await expect(
      mod.setup({ build: "../messages/prosary" }, nuxt(join(root, "app"))),
    ).rejects.toThrow('builds it as "md"');
  });

  it("takes a build in another form when it has no content to serve", async () => {
    await write(false, "md");
    const app = nuxt(join(root, "app"));
    await mod.setup({ build: "../messages/prosary" }, app);
    expect(app.options.nitro.publicAssets).toBeUndefined();
  });
});

describe("prosary module, building content in another form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses to serve it, naming the config", async () => {
    vi.mocked(resolveKit).mockResolvedValueOnce({
      ...built,
      output: "md",
    } as never);
    await expect(mod.setup({}, nuxt())).rejects.toThrow(
      'the content must be built as "hast", which the module renders — the kit config at /app/prosary.config.ts builds it as "md"',
    );
  });

  it("builds messages alone in any form", async () => {
    vi.mocked(resolveKit).mockResolvedValueOnce({
      ...built,
      output: "md",
      documents: [],
      content: { en: {}, fr: {} },
    } as never);
    const app = nuxt();
    await mod.setup({}, app);
    expect(app.options.nitro.publicAssets).toBeUndefined();
  });
});
