import { defineConfig } from "@prosary/kit";

/**
 * The app's messages and content. The `@prosary/nuxt` module finds this
 * file and builds it through `@prosary/kit` at build time.
 *
 * The source messages are the JSON files under `messages/`, each one's keys
 * nested under its name: `title` in `page.json` is `$t.page.title()`. The
 * French and German translations under `.i18n/` mirror them, file for file;
 * they are written by hand and checked in, so the example builds with no
 * model and no API key. To have a model maintain them instead, add a
 * `translate.model` here and run `prosary translate`.
 */
export default defineConfig({
  messages: "messages",
  translate: { source: "en", targets: ["fr", "de"], cache: ".i18n" },
  content: "content",
  formats: {
    number: { price: { style: "currency", currency: "EUR" } },
  },
});
