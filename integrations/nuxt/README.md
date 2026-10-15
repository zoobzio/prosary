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
