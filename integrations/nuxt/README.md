# @prosary/nuxt

Nuxt module for prosary — builds the app's messages, loads one locale per visitor, and provides `$t`.

## Rendering content

`useDocument(path)` loads a content document as the HTML tree the kit built,
in the visitor's locale. `<Prose :tree>` renders it through
[`@prosary/vue`](../vue), with the app's overrides.

The overrides are the `.vue` files at the top level of `app/components/prose`
(or the directory `components` names, relative to `app/`). Each renders the tag or directive its
file name spells in kebab case: `H2.vue` renders every `h2`, `Callout.vue`
every `callout` directive. A component in place of a tag receives the
element's attributes as props and its children in the default slot; one in
place of a directive receives the directive's attributes by the names they
were written with. An override that names neither an element nor a directive
the content builds fails `nuxt typecheck`.

```vue
<script setup lang="ts">
const { data: guide } = await useDocument("guide.md");
</script>

<template>
  <Prose v-if="guide" :tree="guide" />
</template>
```

## Content from a catalog

An app whose documents are not Markdown in the repository — they come from a
CMS, a database, an API that answers HTML trees — serves them through a
[catalog](../../packages/catalog) instead of a build. Add one server route,
and `useDocument` and `<Prose>` work as they do over built content:

```ts
// server/routes/i18n/[...path].ts
export default defineContentHandlers({
  base: "https://cms.example/api",
  headers: { authorization: `Bearer ${process.env.CMS_TOKEN}` },
});
```

`defineContentHandlers` is auto-imported in the server directory. It takes
either the transport config of a service speaking the catalog
[wire protocol](../../packages/catalog#wire-protocol), as above, or the
callbacks of a source of any other shape:

```ts
export default defineContentHandlers({
  list: () => cms.paths(),
  get: (locale, path) => cms.tree(locale, path), // null is a miss
});
```

The route answers the wire protocol's own endpoints — the listing at
`/i18n/content`, a document at `/i18n/content/{locale}/{path}` — and
proves every answer before sending it: a locale outside the contract or a
document the source does not hold is a 404, and an answer that is not an HTML
tree fails rather than render.

```vue
<script setup lang="ts">
const { data: post } = await useDocument("blog/night-trains");
</script>

<template>
  <Prose v-if="post" :tree="post" />
</template>
```

`useDocument` takes any path: an editor completes the documents the app
builds, and any other path is asked of the catalog as the source knows it. So
an app may build some documents and take the rest from a catalog — the built
ones are served first, and the route sees only what they do not answer. A
value typed `AppProsaryDocument` is still one of the built documents exactly.

The endpoints are mounted under `/i18n`. To move them, name another `prefix`
and put the route file under it:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  prosary: { prefix: "/api/lang" }, // server/routes/api/lang/[...path].ts
});
```

With no content built, an override may name any element. An app that builds
content keeps that check: its overrides name what the build declares.
