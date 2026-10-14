import type { Root } from "hast";
import type { ComputedRef } from "vue";
import type {
  AppProsary,
  AppProsaryDocument,
  AppProsaryLocale,
  AppProsaryResolver,
  SetLocale,
} from "./types";

import { computed } from "vue";
import { useNuxtApp } from "#app";
import { useAsyncData, useRequestFetch } from "#imports";
import { CONTENT_URL } from "../constant";

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

/**
 * Composable for one content document, as its HTML syntax tree, in the
 * active locale. The tree is fetched as the JSON file the build wrote for
 * that locale — the server render includes it, and a locale switch fetches
 * the other locale's copy.
 *
 * @param path - The document's path under the content directory.
 */
export const useDocument = (path: AppProsaryDocument) => {
  const { $prosary } = useNuxtApp();
  const request = useRequestFetch();
  const file = path.replace(/\.md$/, ".json");
  return useAsyncData(
    `prosary:document:${path}`,
    () =>
      request<Root>(`${CONTENT_URL}/${$prosary.config.locale}/${file}`, {
        responseType: "json",
      }),
    { watch: [() => $prosary.config.locale] },
  );
};
