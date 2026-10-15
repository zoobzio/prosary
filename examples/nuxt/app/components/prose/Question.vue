<script lang="ts">
import type { VNode } from "vue";

import { Text, defineComponent, h } from "vue";

/** Whether a vnode is nothing but whitespace: the newlines between blocks. */
const blank = (node: VNode): boolean => {
  return (
    node.type === Text &&
    typeof node.children === "string" &&
    node.children.trim() === ""
  );
};

/**
 * Renders every `:::question` directive of the content as a disclosure: the
 * heading the directive opens with is the summary, and what follows is the
 * answer. The children arrive in the default slot as the vnodes the document
 * renders to, so a component can take them apart as well as wrap them.
 */
export default defineComponent({
  name: "Question",
  setup: (_, { slots }) => {
    return () => {
      const [heading, ...answer] = (slots.default?.() ?? []).filter(
        (node) => !blank(node),
      );
      return h("details", { class: "question" }, [
        h("summary", heading === undefined ? [] : [heading]),
        h("div", { class: "answer" }, answer),
      ]);
    };
  },
});
</script>
