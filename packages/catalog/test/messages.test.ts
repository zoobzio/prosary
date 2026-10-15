import { SchemaError } from "@prosary/schema";
import { describe, expect, it, vi } from "vitest";

import {
  FailedRequestError,
  MalformedBundleError,
  MalformedListingError,
} from "../src/error";
import { defineMessageCatalog, defineMessageClient } from "../src/messages";
import { toEntries } from "../src/util";
import { bundles, contract, entries, schema } from "./fixture";

/** A catalog over the fixture bundles, with overridable callbacks. */
const catalog = (
  provider: Partial<Parameters<typeof defineMessageCatalog>[1]> = {},
) =>
  defineMessageCatalog(schema, {
    list: () => entries,
    get: (locale) => bundles[locale as "en"],
    ...provider,
  });

/** A fetch answering each URL from a table of `[status, body]`. */
const wire = (routes: Record<string, [number, unknown]>) =>
  vi.fn(async (input: RequestInfo | URL) => {
    const [status, body] = routes[String(input)] ?? [404, null];
    return new Response(JSON.stringify(body), { status });
  });

describe("defineMessageCatalog", () => {
  it("answers the entries the source serves", async () => {
    await expect(catalog().list()).resolves.toEqual(entries);
  });

  it("awaits a source that answers behind a promise", async () => {
    await expect(
      catalog({ list: async () => [entries[1]] }).list(),
    ).resolves.toEqual([entries[1]]);
  });

  it("tolerates fields beyond the model", async () => {
    const listing = [{ id: "fr", name: "Français", flag: "🇫🇷" }];
    await expect(catalog({ list: () => listing }).list()).resolves.toEqual(
      listing,
    );
  });

  it.each([
    ["not an array", { entries }],
    ["an entry outside the contract", [{ id: "de", name: "Deutsch" }]],
    ["an entry with no name", [{ id: "fr", name: "" }]],
    ["an entry that is not a record", ["fr"]],
  ])("rejects a listing that is %s", async (_label, value) => {
    await expect(catalog({ list: () => value }).list()).rejects.toThrow(
      MalformedListingError,
    );
  });

  it("answers a locale's bundle", async () => {
    await expect(catalog().get("fr")).resolves.toEqual(bundles.fr);
  });

  it.each([null, undefined])(
    "resolves undefined on a %s miss",
    async (miss) => {
      await expect(
        catalog({ get: () => miss }).get("fr"),
      ).resolves.toBeUndefined();
    },
  );

  it("rejects a locale outside the contract before asking the source", async () => {
    const get = vi.fn();
    await expect(catalog({ get }).get("de" as "fr")).rejects.toThrow(
      SchemaError,
    );
    expect(get).not.toHaveBeenCalled();
  });

  it("rejects a payload that fails the contract, naming the locale", async () => {
    const error = await catalog({
      get: () => ({ title: "Bienvenue", retired: [] }),
    })
      .get("fr")
      .catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(MalformedBundleError);
    expect(error).toBeInstanceOf(SchemaError);
    expect((error as MalformedBundleError).locale).toBe("fr");
    expect((error as MalformedBundleError).issues).toHaveLength(2);
  });

  it("lets a source's own failure through untouched", async () => {
    const failure = new Error("storage offline");
    await expect(
      catalog({
        get: () => {
          throw failure;
        },
      }).get("fr"),
    ).rejects.toBe(failure);
  });
});

describe("toEntries", () => {
  it("names each locale of the contract in its own language", () => {
    expect(toEntries(contract)).toEqual(entries);
  });

  it("answers a listing a catalog accepts", async () => {
    await expect(
      catalog({ list: () => toEntries(contract) }).list(),
    ).resolves.toHaveLength(2);
  });
});

describe("defineMessageClient", () => {
  it("lists from {base}/messages", async () => {
    const fetch = wire({ "/api/lang/messages": [200, entries] });
    const client = defineMessageClient(schema, { base: "/api/lang/", fetch });
    await expect(client.list()).resolves.toEqual(entries);
  });

  it("gets a bundle from {base}/messages/{locale}", async () => {
    const fetch = wire({
      "https://lang.example/messages/fr": [200, bundles.fr],
    });
    const client = defineMessageClient(schema, {
      base: "https://lang.example",
      fetch,
    });
    await expect(client.get("fr")).resolves.toEqual(bundles.fr);
  });

  it("sends the configured headers with every request", async () => {
    const fetch = wire({ "/api/messages": [200, entries] });
    await defineMessageClient(schema, {
      base: "/api",
      headers: { authorization: "Bearer token" },
      fetch,
    }).list();
    expect(fetch).toHaveBeenCalledWith("/api/messages", {
      headers: { accept: "application/json", authorization: "Bearer token" },
    });
  });

  it("resolves a 404 on a retrieval as a miss", async () => {
    const client = defineMessageClient(schema, {
      base: "/api",
      fetch: wire({}),
    });
    await expect(client.get("fr")).resolves.toBeUndefined();
  });

  it("fails on a 404 answering the listing", async () => {
    const client = defineMessageClient(schema, {
      base: "/api",
      fetch: wire({}),
    });
    const error = await client.list().catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(FailedRequestError);
    expect(error).toMatchObject({ url: "/api/messages", status: 404 });
  });

  it("fails on any other failure status", async () => {
    const fetch = wire({ "/api/messages/fr": [500, null] });
    await expect(
      defineMessageClient(schema, { base: "/api", fetch }).get("fr"),
    ).rejects.toThrow(FailedRequestError);
  });

  it("proves what the wire answers against the contract", async () => {
    const fetch = wire({ "/api/messages/fr": [200, { retired: [] }] });
    await expect(
      defineMessageClient(schema, { base: "/api", fetch }).get("fr"),
    ).rejects.toThrow(MalformedBundleError);
  });

  it("falls back to the global fetch", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(wire({ "/api/messages": [200, entries] }));
    await expect(
      defineMessageClient(schema, { base: "/api" }).list(),
    ).resolves.toEqual(entries);
    spy.mockRestore();
  });
});
