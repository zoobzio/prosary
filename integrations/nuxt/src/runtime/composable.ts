import type { Root } from "hast";
import type { ComputedRef } from "vue";
import type {
  AppProsary,
  AppProsaryDocumentPath,
  AppProsaryLocale,
  AppProsaryResolver,
  SetLocale,
} from "./types";

import { computed } from "vue";
import { useNuxtApp } from "#app";
import { useAsyncData, useRequestFetch } from "#imports";
import { documents } from "#build/prosary/index.mjs";
import { routes } from "#build/prosary/routes.mjs";

/**
 * Composable for the app's prosary service: the formatting helpers
 * (`number`, `date`, `time`, `relative`, `list`, `name`), the time zone and
 * convention, and the raw state. Everything it reads is reactive, so a
 * template that calls it re-renders when the locale, time zone or convention
 * changes.
 */
export const useProsary = (): AppProsary => {
  const { $prosary } = useNuxtApp();
  return $prosary;
};

/**
 * Composable for the app's messages as functions — the same object templates
 * reach as `$t`: `t.greeting({ name })`, or by key, `t("greeting", { name })`.
 * An `AppProsaryMessage` held as data goes in whole: `t(message)`. Each call formats in the locale active at that moment.
 */
export const useT = (): AppProsaryResolver => {
  const { $t } = useNuxtApp();
  return $t;
};

/**
 * Composable for the locale: the active one, the ones the app is built for,
 * and the switch. `setLocale` loads the locale's bundle before anything
 * changes, so the page never renders a locale it does not hold.
 */
export const useLocale = (): {
  locale: ComputedRef<AppProsaryLocale>;
  locales: readonly AppProsaryLocale[];
  setLocale: SetLocale;
} => {
  const { $prosary, $setLocale } = useNuxtApp();
  return {
    locale: computed(() => $prosary.config.locale),
    locales: $prosary.locales(),
    setLocale: $setLocale,
  };
};

/** The documents the build wrote, as plain paths to look one up in. */
const built: readonly string[] = documents;

/**
 * Composable for one content document, as its HTML syntax tree, in the
 * active locale — the server render includes it, and a locale switch
 * fetches the other locale's copy. A document the app builds is fetched as
 * the JSON file the build wrote for that locale. Any other path is asked of
 * the content endpoint as it stands, which an app whose content lives
 * elsewhere answers from a catalog, with `defineContentHandlers` — so an app
 * may build some of its documents and take the rest from a catalog.
 *
 * @param path - The document's path: under the content directory, or as the
 * catalog knows it.
 */
export const useDocument = (path: AppProsaryDocumentPath) => {
  const { $prosary } = useNuxtApp();
  const request = useRequestFetch();
  const file = built.includes(path)
    ? path.replace(/\.md$/, ".json")
    : path
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");
  return useAsyncData(
    `prosary:document:${path}`,
    () =>
      request<Root>(`${routes.content}/${$prosary.config.locale}/${file}`, {
        responseType: "json",
      }),
    { watch: [() => $prosary.config.locale] },
  );
};
