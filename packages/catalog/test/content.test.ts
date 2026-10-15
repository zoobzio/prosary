import { SchemaError } from "@prosary/schema";
import { describe, expect, it, vi } from "vitest";

import { defineContentCatalog, defineContentClient } from "../src/content";
import {
  FailedRequestError,
  MalformedDocumentError,
  MalformedListingError,
} from "../src/error";
import { paths, schema, trees } from "./fixture";

/** A catalog over the fixture trees, with overridable callbacks. */
const catalog = (
  provider: Partial<Parameters<typeof defineContentCatalog>[1]> = {},
) =>
  defineContentCatalog(schema, {
    list: () => paths,
    get: (locale, path) =>
      paths.includes(path) ? trees[locale as "en"] : null,
    ...provider,
  });

/** A fetch answering each URL from a table of `[status, body]`. */
const wire = (routes: Record<string, [number, unknown]>) =>
  vi.fn(async (input: RequestInfo | URL) => {
    const [status, body] = routes[String(input)] ?? [404, null];
    return new Response(JSON.stringify(body), { status });
  });

describe("defineContentCatalog", () => {
  it("answers the paths the source serves", async () => {
    await expect(catalog().list()).resolves.toEqual(paths);
  });

  it.each([
    ["not an array", { paths }],
    ["holding something other than a path", ["faq.md", 3]],
    ["holding an empty path", [""]],
  ])("rejects a listing that is %s", async (_label, value) => {
    await expect(catalog({ list: () => value }).list()).rejects.toThrow(
      MalformedListingError,
    );
  });

  it("answers a document's tree in a locale", async () => {
    await expect(catalog().get("fr", "faq.md")).resolves.toEqual(trees.fr);
  });

  it("resolves undefined on a miss", async () => {
    await expect(catalog().get("fr", "missing.md")).resolves.toBeUndefined();
  });

  it("rejects a locale outside the contract before asking the source", async () => {
    const get = vi.fn();
    await expect(catalog({ get }).get("de" as "fr", "faq.md")).rejects.toThrow(
      SchemaError,
    );
    expect(get).not.toHaveBeenCalled();
  });

  it("rejects a payload that is not a tree, naming the document", async () => {
    const error = await catalog({ get: () => ({ type: "element" }) })
      .get("fr", "faq.md")
      .catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(MalformedDocumentError);
    expect(error).toMatchObject({ locale: "fr", path: "faq.md" });
  });
});

describe("defineContentClient", () => {
  it("lists from {base}/content", async () => {
    const fetch = wire({ "/api/content": [200, paths] });
    await expect(
      defineContentClient(schema, { base: "/api/", fetch }).list(),
    ).resolves.toEqual(paths);
  });

  it("gets a document from {base}/content/{locale}/{path}, each segment encoded", async () => {
    const fetch = wire({
      "https://cms.example/content/fr/guide/intro%20guide.md": [200, trees.fr],
    });
    await expect(
      defineContentClient(schema, { base: "https://cms.example", fetch }).get(
        "fr",
        "guide/intro guide.md",
      ),
    ).resolves.toEqual(trees.fr);
  });

  it("resolves a 404 on a retrieval as a miss, and fails on any other failure", async () => {
    const client = defineContentClient(schema, {
      base: "/api",
      fetch: wire({ "/api/content/en/faq.md": [500, null] }),
    });
    await expect(client.get("fr", "faq.md")).resolves.toBeUndefined();
    await expect(client.get("en", "faq.md")).rejects.toThrow(
      FailedRequestError,
    );
    await expect(client.list()).rejects.toThrow(FailedRequestError);
  });

  it("proves what the wire answers is a tree", async () => {
    const fetch = wire({ "/api/content/fr/faq.md": [200, "# Hi"] });
    await expect(
      defineContentClient(schema, { base: "/api", fetch }).get("fr", "faq.md"),
    ).rejects.toThrow(MalformedDocumentError);
  });
});
