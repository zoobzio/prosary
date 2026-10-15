# Prose example

The messages and content of the examples, built with `@prosary/kit` into a
package the Nuxt example imports. `prosary build` writes the contract module,
a bundle per locale, and the content under `.dist/`, which is what this
package exports; the Nuxt example's `prosary.build` option names it.

```sh
pnpm --filter @prosary/example-prose build
```

- `prosary.config.ts` — the source messages, the locales, the content and
  its presets
- `src/messages/` — the source messages, in English, one file per group:
  `title` in `page.json` is `$t.page.title()`
- `.i18n/` — French and German, mirroring `src/messages/` file for file and
  `src/content/` document for document, written by hand and checked in
- `src/content/` — the Markdown content, in English, built with every preset
