# Prose example

The messages, content and translations of Solstice Rail, built with
`@prosary/kit` into a package the Nuxt example imports. `prosary build` writes
the contract module, a bundle per locale, and the content under `.dist/`,
which is what this package exports; the Nuxt example's `prosary.build` option
names it.

```sh
pnpm --filter @prosary/example-prose build
```

- `prosary.config.ts` — the source messages, the content and its presets, the
  named formats, and the locales
- `src/messages/` — the source messages, in English, one file per group:
  `heading` in `hero.json` is `$t.hero.heading()`, and the dotted
  `seat.name` in `fare.json` is `$t.fare.seat.name()`
- `src/content/` — the prose of the site as Markdown: four documents at the
  top, the journal posts under `journal/`, the conditions under `legal/`.
  Built with every preset: front matter onto the root of the tree, GFM
  tables, task lists and strikethrough, `{#id}` heading ids, and `:::callout`,
  `:::question` and `:badge[]` directives as marked elements
- `.i18n/` — French and German, mirroring `src/messages/` file for file and
  `src/content/` document for document, written by hand and checked in, so
  the example builds with no model and no API key

To have a model maintain the translations instead, add a `translate.model` to
the config — `"anthropic/claude-sonnet-5-5"`, say, with `@ai-sdk/anthropic`
installed and `ANTHROPIC_API_KEY` set — and run `prosary translate`: it
translates what the locales lack,
brings a document up to date from the translation it has when its source
changes, and never writes over a translation someone wrote by hand.
