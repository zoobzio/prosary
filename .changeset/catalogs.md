---
"@prosary/catalog": minor
"prosary": minor
---

`@prosary/catalog` has two catalogs, each in a serving and a consuming angle.
`defineMessageCatalog` / `defineMessageClient` are the locale-bundle catalog
as before, renamed, with the wire routes under `{base}/messages`.
`defineContentCatalog` / `defineContentClient` are new: a source of content
documents, `list` answering their paths and `get(locale, path)` answering one
document's HTML tree, with the wire routes under `{base}/content`. The
umbrella package no longer re-exports the catalog; import it from
`@prosary/catalog`.
