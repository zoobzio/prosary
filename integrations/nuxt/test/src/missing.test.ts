import type { NuxtProsaryConfig } from "../../src/config";

import { describe, it, expect, vi } from "vitest";

vi.mock("@nuxt/kit", () => ({
  defineNuxtModule: (def: unknown) => def,
  addTemplate: vi.fn(),
  addPlugin: vi.fn(),
  addImports: vi.fn(),
  createResolver: () => ({
    resolve: (p: string) => p,
    resolvePath: async (p: string) => p,
  }),
  directoryToURL: vi.fn(),
  tryResolveModule: vi.fn(),
  useLogger: vi.fn(),
}));

/* An app without the kit installed: importing it fails. */
vi.mock("@prosary/kit", () => {
  throw new Error("Cannot find package '@prosary/kit'");
});

import module from "../../src/module";

const mod = module as unknown as {
  setup: (options: NuxtProsaryConfig, nuxt: unknown) => Promise<void>;
};

describe("prosary module, without the kit installed", () => {
  it("says the kit is needed to build the app's own messages", async () => {
    const nuxt = {
      options: { rootDir: "/app", buildDir: "/app/.nuxt", watch: [] },
    };
    await expect(mod.setup({}, nuxt)).rejects.toThrow(
      "needs @prosary/kit, which could not be loaded — add it to your devDependencies",
    );
  });
});
