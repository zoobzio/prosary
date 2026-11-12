import { describe, it, expect, vi } from "vitest";

vi.mock(
  "#prosary/index.mjs",
  () => import("../../src/stubs/build/prosary/index.mjs"),
);

vi.mock(
  "#prosary/routes.mjs",
  () => import("../../src/stubs/build/prosary/routes.mjs"),
);

vi.mock("#imports", () => ({
  defineEventHandler: (handler: unknown) => handler,
  createError: ({ statusCode }: { statusCode: number }) =>
    Object.assign(new Error(`status ${statusCode}`), { statusCode }),
}));

import { defineContentHandlers } from "../../src/runtime/server/handlers";

const tree = { type: "root", children: [{ type: "text", value: "Bonjour" }] };

/** A source of callbacks holding one document, in French. */
const source = () => ({
  list: vi.fn(() => ["guide/intro"]),
  get: vi.fn((locale: string, path: string) =>
    locale === "fr" && path === "guide/intro" ? tree : null,
  ),
});

const call = (handler: unknown, path: string): Promise<unknown> =>
  (handler as (event: { path: string }) => Promise<unknown>)({ path });

describe("defineContentHandlers", () => {
  it("answers a document from the source, by locale and path", async () => {
    const content = source();
    const handler = defineContentHandlers(content);
    await expect(
      call(handler, "/i18n/content/fr/guide/intro"),
    ).resolves.toEqual(tree);
    expect(content.get).toHaveBeenCalledWith("fr", "guide/intro");
  });

  it("decodes the path's segments and drops the query", async () => {
    const content = source();
    const handler = defineContentHandlers(content);
    await call(handler, "/i18n/content/pt-BR/a%20b/c%2Fd?x=1").catch(
      () => undefined,
    );
    expect(content.get).toHaveBeenCalledWith("pt-BR", "a b/c/d");
  });

  it("answers the listing at the endpoint itself", async () => {
    const handler = defineContentHandlers(source());
    await expect(call(handler, "/i18n/content")).resolves.toEqual([
      "guide/intro",
    ]);
    await expect(call(handler, "/i18n/content/")).resolves.toEqual([
      "guide/intro",
    ]);
  });

  it.each([
    ["a document the source does not hold", "/i18n/content/fr/missing"],
    ["a locale outside the contract", "/i18n/content/de/guide/intro"],
    ["a locale with no document", "/i18n/content/fr"],
    ["a path outside the endpoint", "/i18n/messages"],
    ["a path that only starts like it", "/i18n/contents/fr/guide/intro"],
    ["a path that does not decode", "/i18n/content/fr/%E0%A4%A"],
  ])("answers %s with a 404", async (_name, path) => {
    const handler = defineContentHandlers(source());
    await expect(call(handler, path)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("never asks the source for a locale outside the contract", async () => {
    const content = source();
    const handler = defineContentHandlers(content);
    await call(handler, "/i18n/content/de/guide/intro").catch(() => undefined);
    expect(content.get).not.toHaveBeenCalled();
  });

  it("fails rather than send what is not a tree", async () => {
    const handler = defineContentHandlers({
      list: () => [],
      get: () => ({ html: "<p>hi</p>" }),
    });
    await expect(
      call(handler, "/i18n/content/fr/guide/intro"),
    ).rejects.toMatchObject({ name: "MalformedDocumentError" });
  });

  it("reaches a remote catalog over the wire, given transport config", async () => {
    const fetch = vi.fn(
      async (_url: string, _init?: unknown) =>
        new Response(JSON.stringify(tree), { status: 200 }),
    );
    const handler = defineContentHandlers({
      base: "https://cms.example/api/",
      headers: { authorization: "Bearer token" },
      fetch: fetch as unknown as typeof globalThis.fetch,
    });
    await expect(
      call(handler, "/i18n/content/fr/guide/intro"),
    ).resolves.toEqual(tree);
    expect(fetch).toHaveBeenCalledWith(
      "https://cms.example/api/content/fr/guide/intro",
      {
        headers: {
          accept: "application/json",
          authorization: "Bearer token",
        },
      },
    );
  });
});
