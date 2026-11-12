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

vi.mock(
  "#build/prosary/index.mjs",
  () => import("../../src/stubs/build/prosary/index.mjs"),
);

vi.mock(
  "#build/prosary/routes.mjs",
  () => import("../../src/stubs/build/prosary/routes.mjs"),
);

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
      url: "/i18n/content/fr/guide/start.json",
    });
    expect(request).toHaveBeenCalledWith("/i18n/content/fr/guide/start.json", {
      responseType: "json",
    });
  });

  it("asks the endpoint for a path the build does not know, as it stands", async () => {
    config.locale = "fr";
    const load = useDocument(
      "blog/été 2026.md",
    ) as unknown as () => Promise<unknown>;
    await load();
    expect(request).toHaveBeenLastCalledWith(
      "/i18n/content/fr/blog/%C3%A9t%C3%A9%202026.md",
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
