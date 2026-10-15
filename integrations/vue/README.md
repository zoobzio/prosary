# @prosary/vue

Renders prosary content in Vue: the HTML tree `@prosary/kit` builds a
document to, as vnodes, with components in place of the elements you choose.

## Install

```sh
pnpm add @prosary/vue
```

## Usage

```vue
<script setup lang="ts">
import { ProsaryDocument } from "@prosary/vue";
import Callout from "./Callout.vue";
import Heading from "./Heading.vue";
</script>

<template>
  <ProsaryDocument
    :tree="tree"
    :components="{ h2: Heading, callout: Callout }"
  />
</template>
```

Each element renders as its tag, with its attributes. Each text node renders
as text. Comments render nothing.

## Components

`components` names what renders in place of an element, by tag name or, for
an element built from a directive, by the directive's name. A directive's
name wins over its tag.

- A component in place of a tag receives the element's attributes as props
  by their HTML names (`id`, `class`, `href`) and the children in its
  default slot.
- A component in place of a directive receives the directive's attributes by
  the names they were written with — `:::callout{kind="warning"}` gives
  `kind` — and the children in its default slot. The marker is left out.

## Render function

`render(tree, components)` returns the vnode children for a tree, for a
render function of your own. `MARKER` is the property that names a directive
on its element.
