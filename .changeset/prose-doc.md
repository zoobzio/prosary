---
"@prosary/nuxt": minor
---

`<Prose :tree>` renders a content document through `@prosary/vue` with
the app's overrides: the `.vue` files at the top level of `app/components/prose`
(or the directory the `components` option names, relative to `app/`), each rendering the tag or
directive its file name spells in kebab case. The module builds the component
map at build time and types it against the elements and directives the
content builds, so an override nothing renders fails `nuxt typecheck`.
