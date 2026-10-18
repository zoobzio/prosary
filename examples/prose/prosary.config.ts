import { defineConfig } from "@prosary/kit/config";
import { directives, gfm, headings, matter } from "@prosary/parse/plugins";

/**
 * The messages and content of Solstice Rail, the fictional night-train
 * company the Nuxt example is a landing page for. `prosary build` writes the
 * contract module, a bundle per locale, and the content under `.dist/`,
 * which this package exports; the Nuxt example points its `build` option
 * here.
 *
 * The source messages are the JSON files under `src/messages/`, each one's
 * keys nested under its name: `heading` in `hero.json` is `$t.hero.heading()`,
 * and a dotted key nests further, so `seat.name` in `fare.json` is
 * `$t.fare.seat.name()`. The French and German translations under `.i18n/`
 * mirror them, file for file; they are written by hand and checked in, so the
 * example builds with no model and no API key. To have a model maintain them
 * instead, add a `translate.model` here — `"anthropic/claude-sonnet-5-5"`,
 * say, with `@ai-sdk/anthropic` installed and `ANTHROPIC_API_KEY` set — and
 * run `prosary translate`.
 *
 * The content under `src/content/` is the prose of the site: the documents a
 * section renders whole, and the journal posts under `journal/`. Each one is
 * translated as a document of its own under `.i18n/<locale>/`, and built
 * with every preset: frontmatter onto the root of the tree, GFM tables and
 * task lists, `{#id}` heading ids, and directives as marked elements.
 *
 * The named formats are what messages refer to by name — `{amount, number,
 * price}` — and what the runtime's helpers take in place of options. The
 * `calendar` date format fixes its time zone, so a date that is a day and not
 * an instant reads the same in every zone.
 */
export default defineConfig({
  messages: "src/messages",
  content: {
    dir: "src/content",
    presets: [matter(), gfm(), headings(), directives()],
  },
  formats: {
    number: {
      price: { style: "currency", currency: "EUR", maximumFractionDigits: 0 },
      compact: { notation: "compact" },
      distance: { style: "unit", unit: "kilometer", maximumFractionDigits: 0 },
    },
    date: {
      departure: { weekday: "long", day: "numeric", month: "long" },
      calendar: { dateStyle: "long", timeZone: "UTC" },
    },
  },
  translate: { source: "en", targets: ["fr", "de"], cache: ".i18n" },
  outDir: ".dist",
});
