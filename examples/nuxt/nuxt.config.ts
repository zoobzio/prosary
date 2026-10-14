import { defineNuxtConfig } from "nuxt/config";

/**
 * The prosary example.
 *
 * The message wiring lives in `prosary.config.ts`: the module finds it and
 * builds it through `@prosary/kit`, so no `prosary` options are needed here.
 * The module renders each visitor in one locale — their cookie, else what
 * their browser asks for — and provides `$t`, `useProsary` and `useLocale`.
 */
export default defineNuxtConfig({
  compatibilityDate: "2026-07-01",
  modules: ["@prosary/nuxt"],
});
