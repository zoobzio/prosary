# prosary

## 0.0.1

### Patch Changes

- [`19b4ba1`](https://github.com/zoobzio/prosary/commit/19b4ba18dec825983c3f87c67ace6359dd6ab65a) Thanks [@zoobzio](https://github.com/zoobzio)! - `@prosary/catalog` has two catalogs, each in a serving and a consuming angle.
  `defineMessageCatalog` / `defineMessageClient` are the locale-bundle catalog
  as before, renamed, with the wire routes under `{base}/messages`.
  `defineContentCatalog` / `defineContentClient` are new: a source of content
  documents, `list` answering their paths and `get(locale, path)` answering one
  document's HTML tree, with the wire routes under `{base}/content`. The
  umbrella package no longer re-exports the catalog; import it from
  `@prosary/catalog`.

- [`858b521`](https://github.com/zoobzio/prosary/commit/858b5212c7385bc73158311ef6eef44c04eba33e) Thanks [@zoobzio](https://github.com/zoobzio)! - The translation system publishes under its own names: `prosary` is the
  umbrella package, and `@prosary/*` are the runtime, the catalog, the schema,
  the build kit, the translator, and the Nuxt module. The CLI is `prosary`, the
  config file is `prosary.config.ts`, the Nuxt config key is `prosary`, and the
  runtime service is `makeProsary`.
- Updated dependencies [[`858b521`](https://github.com/zoobzio/prosary/commit/858b5212c7385bc73158311ef6eef44c04eba33e)]:
  - @prosary/core@0.0.1
  - @prosary/schema@0.0.1
