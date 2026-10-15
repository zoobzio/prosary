import { defineNuxtConfig } from "nuxt/config";

/**
 * The prosary example: the landing page of Solstice Rail, a fictional
 * night-train company.
 *
 * The messages and content live in `@prosary/example-prose`, built there
 * with `@prosary/kit`; `build` points the module at that build, so this app
 * carries no kit config and no kit. The module renders each visitor in one
 * locale — their cookie, else what their browser asks for — and provides
 * `$t`, `useProsary`, `useLocale` and `useDocument`, and `<Prose>` with the
 * overrides under `app/components/prose`.
 */
export default defineNuxtConfig({
  compatibilityDate: "2026-07-01",
  modules: ["@prosary/nuxt"],
  prosary: { build: "@prosary/example-prose" },
  css: ["~/assets/css/main.css"],
});
