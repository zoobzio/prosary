import type { Root } from "hast";
import type { PropType } from "vue";

import { defineComponent } from "vue";

import type { Components } from "./types";
import { render } from "./render";

/**
 * Renders a content document: the HTML tree the kit built, as vnodes in
 * place. `components` names what renders instead of an element, by tag or
 * by directive.
 */
export const ProsaryDocument = defineComponent({
  name: "ProsaryDocument",
  props: {
    tree: { type: Object as PropType<Root>, required: true },
    components: { type: Object as PropType<Components>, default: () => ({}) },
  },
  setup: (props) => () => render(props.tree, props.components),
});
