import { describe, it, expect, vi } from "vitest";
import { reactive } from "vue";

const config = reactive({ locale: "en" });
const service = { config, locales: () => ["en", "fr"] };
const resolver = { marker: "t" };
const setLocale = vi.fn();
const nuxtApp = { $prosary: service, $t: resolver, $setLocale: setLocale };

vi.mock("#app", () => ({
  useNuxtApp: () => nuxtApp,
}));

const { request, asyncData } = vi.hoisted(() => ({
  request: vi.fn(async (url: string) => ({ type: "root", url })),
  asyncData: vi.fn(
    (_key: string, handler: () => Promise<unknown>, _options: unknown) =>
      handler,
  ),
}));

vi.mock("#imports", () => ({
  useRequestFetch: () => request,
  useAsyncData: asyncData,
}));

import {
  useDocument,
  useProsary,
  useLocale,
  useT,
} from "../../src/runtime/composable";

describe("useProsary", () => {
  it("returns the $prosary service from the nuxt app", () => {
    expect(useProsary()).toBe(service);
  });
});

describe("useT", () => {
  it("returns the $t resolver from the nuxt app", () => {
    expect(useT()).toBe(resolver);
  });
});

describe("useLocale", () => {
  it("exposes the active locale reactively, the locales and the switch", () => {
    const { locale, locales, setLocale: set } = useLocale();
    expect(locale.value).toBe("en");
    expect(locales).toEqual(["en", "fr"]);
    expect(set).toBe(setLocale);
    config.locale = "fr";
    expect(locale.value).toBe("fr");
  });
});

describe("useDocument", () => {
  it("fetches the document's tree for the active locale, as JSON", async () => {
    config.locale = "fr";
    const load = useDocument(
      "guide/start.md",
    ) as unknown as () => Promise<unknown>;
    await expect(load()).resolves.toEqual({
      type: "root",
      url: "/_prosary/content/fr/guide/start.json",
    });
    expect(request).toHaveBeenCalledWith(
      "/_prosary/content/fr/guide/start.json",
      { responseType: "json" },
    );
  });

  it("is keyed by the document and refetches when the locale changes", () => {
    useDocument("intro.md");
    const [key, , options] = asyncData.mock.calls.at(-1) ?? [];
    expect(key).toBe("prosary:document:intro.md");
    const [source] = (options as { watch: Array<() => unknown> }).watch;
    config.locale = "en";
    expect(source?.()).toBe("en");
  });
});
