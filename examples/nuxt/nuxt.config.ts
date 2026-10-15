import { defineNuxtConfig } from "nuxt/config";

/**
 * The prosary example.
 *
 * The messages and content live in `@prosary/example-prose`, built there
 * with `@prosary/kit`; `build` points the module at that build, so this app
 * carries no kit config and no kit. The module renders each visitor in one
 * locale — their cookie, else what their browser asks for — and provides
 * `$t`, `useProsary` and `useLocale`.
 */
export default defineNuxtConfig({
  compatibilityDate: "2026-07-01",
  modules: ["@prosary/nuxt"],
  prosary: { build: "@prosary/example-prose" },
});
