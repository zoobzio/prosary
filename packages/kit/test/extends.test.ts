import type { Translate } from "@prosary/translate";

import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { KitConfig } from "../src/types";
import { loadChain } from "../src/chain";
import { InvalidConfigError, InvalidMessagesError } from "../src/error";
import { generate } from "../src/generate";
import { resolveKit } from "../src/resolve";
import { translate } from "../src/translate";
import { discard } from "./helpers";

/** The presets, by source: the throwaway project cannot resolve the package by name. */
const PRESETS = JSON.stringify(
  fileURLToPath(new URL("../../parse/src/plugins/index.ts", import.meta.url)),
);

/** The project's own config: it extends the installed `@acme/words`. */
const CONFIG = {
  messages: "messages",
  extends: "@acme/words/config",
  content: "content",
  formats: { number: { price: { style: "currency", currency: "EUR" } } },
  translate: { source: "en", targets: ["fr", "de"], cache: "translations" },
} satisfies KitConfig;

/** Where the fake package stands in the project. */
const WORDS = "node_modules/@acme/words";

let root: string;

/** Writes a file of the project, making its directory. */
const write = async (path: string, contents: string) => {
  await mkdir(dirname(join(root, path)), { recursive: true });
  await writeFile(join(root, path), contents);
};

/** Writes a JSON document of the project. */
const json = (path: string, value: unknown) =>
  write(path, JSON.stringify(value));

/** A JSON document of the project, parsed. */
const read = async (path: string) =>
  JSON.parse(await readFile(join(root, path), "utf8")) as unknown;

/** Whether the project has a file at a path. */
const exists = (path: string) =>
  stat(join(root, path)).then(
    () => true,
    () => false,
  );

/** A config module with the matter preset on its content. */
const configure = (config: KitConfig) =>
  `import { matter } from ${PRESETS};\nconst config = ${JSON.stringify(config)};\nconfig.content = { dir: config.content, presets: [matter()] };\nexport default config;\n`;

/** The issues of the error a promise must reject with. */
const issues = async (
  promise: Promise<unknown>,
  type: typeof InvalidConfigError | typeof InvalidMessagesError,
): Promise<string[]> => {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(type);
  return (error as InvalidConfigError).issues;
};

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "prosary-kit-"));

  // The installed package: messages, content, a named format, and French.
  await json(`${WORDS}/package.json`, {
    name: "@acme/words",
    type: "module",
    exports: { "./config": "./prosary.config.ts" },
  });
  await write(
    `${WORDS}/prosary.config.ts`,
    configure({
      messages: "src/messages",
      content: "src/content",
      formats: {
        number: { compact: { notation: "compact" } },
        date: { calendar: { dateStyle: "long" } },
      },
      translate: { source: "en", targets: ["fr"], cache: ".i18n" },
    }),
  );
  await json(`${WORDS}/src/messages/brand.json`, {
    name: { defaultMessage: "Acme" },
    tagline: { defaultMessage: "Things, shipped {when, date, calendar}" },
  });
  await json(`${WORDS}/src/messages/action.json`, {
    save: { defaultMessage: "Save" },
    cancel: { defaultMessage: "Cancel" },
  });
  await json(`${WORDS}/.i18n/fr/action.json`, {
    save: "Enregistrer",
    cancel: "Annuler",
  });
  await json(`${WORDS}/.i18n/fr/brand.json`, { name: "Acmé" });
  await write(
    `${WORDS}/src/content/legal.md`,
    "---\nkind: legal\n---\n\nTerms.\n",
  );
  await write(`${WORDS}/src/content/about.md`, "# About Acme\n");
  await write(`${WORDS}/.i18n/fr/about.md`, "# À propos d'Acme\n");

  // The project: its own messages, one of which declares an upstream key
  // again, and one document that replaces an upstream one.
  await json("messages/brand.json", {
    tagline: { defaultMessage: "Acme, {count, number, compact} strong" },
  });
  await json("messages/page.json", {
    title: { defaultMessage: "Welcome" },
  });
  await json("translations/fr/page.json", { title: "Bienvenue" });
  await write("content/about.md", "# About us\n");
  await write("content/faq.md", "# FAQ\n");
});

afterEach(async () => {
  await discard(root);
});

describe("loadChain", () => {
  it("lists the configs upstream first, the project's own last", async () => {
    const chain = await loadChain(CONFIG, root);
    expect(chain.map((origin) => [origin.label, origin.local])).toEqual([
      ["@acme/words/config", false],
      [undefined, true],
    ]);
    expect(chain[0]?.root).toBe(join(root, WORDS));
    expect(chain[0]?.path).toBe(join(root, WORDS, "prosary.config.ts"));
    expect(chain[0]?.settings.translations).toBe(".i18n");
  });

  it("resolves a path relative to the project root", async () => {
    await write(
      "base/prosary.config.ts",
      'export default { messages: "base.json", translate: { source: "en" } };\n',
    );
    const chain = await loadChain(
      { ...CONFIG, extends: "./base/prosary.config.ts" },
      root,
    );
    expect(chain[0]?.root).toBe(join(root, "base"));
  });

  it("follows an upstream's own extends, and reads a config once", async () => {
    await write(
      "base/prosary.config.ts",
      'export default { messages: "base.json", extends: "@acme/words/config", translate: { source: "en" } };\n',
    );
    const chain = await loadChain(
      {
        ...CONFIG,
        extends: ["./base/prosary.config.ts", "@acme/words/config"],
      },
      root,
    );
    expect(chain.map((origin) => origin.label)).toEqual([
      "@acme/words/config",
      "./base/prosary.config.ts",
      undefined,
    ]);
  });

  it("rejects an extends that cannot be resolved", async () => {
    expect(
      await issues(
        loadChain({ ...CONFIG, extends: "@acme/nope/config" }, root),
        InvalidConfigError,
      ),
    ).toEqual([
      expect.stringMatching(
        /^extends "@acme\/nope\/config" could not be resolved from /,
      ),
    ]);
  });

  it("rejects a cycle", async () => {
    await write(
      "a.config.ts",
      'export default { messages: "a.json", extends: "./b.config.ts", translate: { source: "en" } };\n',
    );
    await write(
      "b.config.ts",
      'export default { messages: "b.json", extends: "./a.config.ts", translate: { source: "en" } };\n',
    );
    expect(
      await issues(
        loadChain({ ...CONFIG, extends: "./a.config.ts" }, root),
        InvalidConfigError,
      ),
    ).toEqual([
      expect.stringMatching(/^extends ".\/a.config.ts" forms a cycle/),
    ]);
  });

  it("rejects an upstream in another source locale", async () => {
    await write(
      "base/prosary.config.ts",
      'export default { messages: "base.json", translate: { source: "fr" } };\n',
    );
    expect(
      await issues(
        loadChain({ ...CONFIG, extends: "./base/prosary.config.ts" }, root),
        InvalidConfigError,
      ),
    ).toEqual([
      'extends "./base/prosary.config.ts" is written in "fr", not "en" — a config extends only configs in its own source locale',
    ]);
  });

  it("reports an upstream's own issues under its name", async () => {
    await write(
      "base/prosary.config.ts",
      'export default { messages: "base.json", translate: { source: "en", targets: ["en"] } };\n',
    );
    expect(
      await issues(
        loadChain({ ...CONFIG, extends: "./base/prosary.config.ts" }, root),
        InvalidConfigError,
      ),
    ).toEqual([
      './base/prosary.config.ts: translate.targets[0] "en" is the source locale — list only the locales it is translated to',
    ]);
  });

  it("rejects an extends that is not a specifier", async () => {
    expect(
      await issues(
        loadChain({ ...CONFIG, extends: [""] }, root),
        InvalidConfigError,
      ),
    ).toEqual([
      "extends must name a kit config, or a list of them, each as a path or as a package would be imported",
    ]);
  });
});

describe("resolveKit with extends", () => {
  it("merges the upstream's messages under the project's, the project winning", async () => {
    const kit = await resolveKit(CONFIG, { cwd: root });
    expect(Object.keys(kit.messages)).toEqual([
      "action.save",
      "action.cancel",
      "brand.name",
      "brand.tagline",
      "page.title",
    ]);
    expect(kit.messages["brand.tagline"]?.source).toBe(
      "Acme, {count, number, compact} strong",
    );
    expect(kit.messages["action.save"]?.source).toBe("Save");
  });

  it("merges the named formats, so a message may use an upstream's", async () => {
    const kit = await resolveKit(CONFIG, { cwd: root });
    expect(kit.formats).toEqual({
      number: {
        compact: { notation: "compact" },
        price: { style: "currency", currency: "EUR" },
      },
      date: { calendar: { dateStyle: "long" } },
      time: {},
    });
  });

  it("reads each config's translations from its own cache", async () => {
    const kit = await resolveKit(CONFIG, { cwd: root });
    expect(kit.bundles.fr?.["action.save"]).toEqual([
      { type: 0, value: "Enregistrer" },
    ]);
    expect(kit.bundles.fr?.["brand.name"]).toEqual([
      { type: 0, value: "Acmé" },
    ]);
    expect(kit.bundles.fr?.["page.title"]).toEqual([
      { type: 0, value: "Bienvenue" },
    ]);
    // The overridden key: the project's, untranslated, so the source.
    expect(kit.bundles.fr?.["brand.tagline"]).toBe(
      kit.bundles.en?.["brand.tagline"],
    );
    // The project's about.md replaced the upstream's, French included.
    expect(kit.coverage.fr).toEqual({
      missing: ["brand.tagline"],
      orphaned: [],
      documents: ["about.md", "legal.md", "faq.md"],
    });
    // A locale the upstream does not translate to falls back to the source.
    expect(kit.coverage.de?.missing).toEqual(Object.keys(kit.messages));
  });

  it("leaves an upstream's translation of an overridden key out, not orphaned", async () => {
    await json(`${WORDS}/.i18n/fr/brand.json`, {
      name: "Acmé",
      tagline: "Des choses, livrées {when, date, calendar}",
    });
    const kit = await resolveKit(CONFIG, { cwd: root });
    expect(kit.bundles.fr?.["brand.tagline"]).toBe(
      kit.bundles.en?.["brand.tagline"],
    );
    expect(kit.coverage.fr?.orphaned).toEqual([]);
  });

  it("merges the content, each document built with its own presets", async () => {
    const kit = await resolveKit(CONFIG, { cwd: root });
    expect(kit.documents).toEqual(["about.md", "legal.md", "faq.md"]);
    const about = JSON.parse(kit.content.en?.["about.md"] ?? "") as {
      children: { children: { value: string }[] }[];
    };
    expect(about.children[0]?.children[0]?.value).toBe("About us");
    // The upstream's matter preset lifts its front matter onto the root.
    const legal = JSON.parse(kit.content.en?.["legal.md"] ?? "") as {
      data?: { matter?: unknown };
    };
    expect(legal.data?.matter).toEqual({ kind: "legal" });
    // The project's about.md replaced the upstream's, translation and all.
    expect(kit.content.fr?.["about.md"]).toBe(kit.content.en?.["about.md"]);
  });

  it("lists every file it read, the upstream's config included", async () => {
    const kit = await resolveKit(CONFIG, { cwd: root });
    expect(kit.inputs).toEqual(
      expect.arrayContaining([
        join(root, WORDS, "src/messages/action.json"),
        join(root, WORDS, "prosary.config.ts"),
        join(root, WORDS, ".i18n/fr/action.json"),
        join(root, WORDS, "src/content/legal.md"),
        join(root, "messages/page.json"),
        join(root, "translations/fr/page.json"),
        join(root, "content/faq.md"),
      ]),
    );
    expect(kit.inputs).not.toContain(join(root, WORDS, ".i18n/fr/about.md"));
  });

  it("emits the merged contract", async () => {
    const output = await generate(CONFIG, { cwd: root });
    const declarations = output.files.find(
      (file) => file.path === "index.d.mts",
    );
    expect(declarations?.contents).toContain('| "action.save"');
    expect(declarations?.contents).toContain('| "page.title"');
    expect(declarations?.contents).toContain('"brand.tagline": {');
  });

  it("still refuses a key both a message and a group across configs", async () => {
    await json("messages/action.json", {
      "save.now": { defaultMessage: "Save now" },
    });
    expect(
      await issues(resolveKit(CONFIG, { cwd: root }), InvalidMessagesError),
    ).toEqual([
      '"action.save" (src/messages/action.json (@acme/words/config)) is both a message and the group of "action.save.now" (messages/action.json)',
    ]);
  });
});

describe("translate with extends", () => {
  const configured = async () => {
    await write(
      "prosary.config.ts",
      configure({
        ...CONFIG,
        translate: { ...CONFIG.translate, model: "openai/test" },
      }),
    );
  };

  /** Marks what it is asked for, so a test sees what was asked. */
  const marking = () =>
    vi.fn<Translate>(async ({ target, messages }) =>
      Object.fromEntries(
        Object.entries(messages).map(([key, { message }]) => [
          key,
          `[${target}] ${message}`,
        ]),
      ),
    );

  it("translates only the project's own messages and documents", async () => {
    await configured();
    const translator = marking();
    const documentTranslator = vi.fn(
      async ({ document }: { document: string }) => document,
    );
    const output = await translate({
      root,
      translator,
      documentTranslator,
      locales: ["fr"],
    });
    expect(output.fr?.written).toEqual(["brand.tagline"]);
    expect(output.fr?.documents.written).toEqual(["about.md", "faq.md"]);
    expect(await read("translations/fr/brand.json")).toEqual({
      tagline: "[fr] Acme, {count, number, compact} strong",
    });
    expect(await exists("translations/fr/action.json")).toBe(false);
    expect(await exists(`${WORDS}/.i18n/fr/legal.md`)).toBe(false);
    expect(await exists(`${WORDS}/.i18n/de`)).toBe(false);
  });

  it("checks against the upstream's named formats", async () => {
    await configured();
    const translator = vi.fn<Translate>(async () => ({
      "brand.tagline": "[fr] {count, number, compacte}",
    }));
    const output = await translate({
      root,
      translator,
      documentTranslator: async ({ document }) => document,
      locales: ["fr"],
    });
    expect(output.fr?.rejected["brand.tagline"]).toEqual([
      'uses the number format "compacte", which is neither built in nor declared in the config\'s formats',
    ]);
  });

  it("reports only the project's own as pending on a check", async () => {
    await configured();
    const output = await translate({ root, check: true });
    expect(output.fr?.pending).toEqual(["brand.tagline"]);
    expect(output.fr?.documents.pending).toEqual(["about.md", "faq.md"]);
    expect(output.de?.pending).toEqual(["brand.tagline", "page.title"]);
  });
});
