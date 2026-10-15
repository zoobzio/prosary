import type { Root } from "hast";
import type { PropType } from "vue";

import { ProsaryDocument } from "@prosary/vue";
import { defineComponent, h } from "vue";

import { components } from "#build/prosary/components.mjs";

/**
 * Renders a content document with the app's overrides: `ProsaryDocument`
 * of `@prosary/vue`, given the component map built from the overrides
 * directory. Takes the tree `useDocument` loads.
 */
export default defineComponent({
  name: "Prose",
  props: {
    tree: { type: Object as PropType<Root>, required: true },
  },
  setup: (props) => () => h(ProsaryDocument, { tree: props.tree, components }),
});
