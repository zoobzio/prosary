import type { Preset } from "../types";
import type { Directives } from "mdast-util-directive";
import type { Root } from "mdast";
import type { Plugin } from "unified";

import remarkDirective from "remark-directive";
import { visit } from "unist-util-visit";

import type {} from "mdast-util-to-hast";

/**
 * The property that marks an element built from a directive and names the
 * directive: `data-directive` in HTML.
 */
const MARKER = "dataDirective";

/** The element each kind of directive builds. */
const ELEMENT: Record<Directives["type"], string> = {
  containerDirective: "div",
  leafDirective: "div",
  textDirective: "span",
};

/** The property name of a data attribute: `data-x` style, from the attribute's name. */
const data = (name: string): string => {
  return `data${name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}`;
};

/**
 * Names the element each directive builds and its properties: the marker
 * naming the directive, and its attributes.
 */
const mark: Plugin<[], Root> = () => (tree) => {
  visit(tree, (node) => {
    if (
      node.type !== "containerDirective" &&
      node.type !== "leafDirective" &&
      node.type !== "textDirective"
    ) {
      return;
    }
    const hProperties: Record<string, string | string[]> = {};
    for (const [name, value] of Object.entries(node.attributes ?? {})) {
      if (value === null || value === undefined) {
        continue;
      }
      if (name === "id") {
        hProperties.id = value;
      } else if (name === "class") {
        hProperties.className = value.split(/\s+/).filter(Boolean);
      } else {
        hProperties[data(name)] = value;
      }
    }
    hProperties[MARKER] = node.name;
    node.data = { ...node.data, hName: ELEMENT[node.type], hProperties };
  });
};

/**
 * Directives. `:::name{attrs}` is a container, `::name{attrs}` is a leaf,
 * and `:name[text]{attrs}` is inline. Each builds as an element marked with
 * `data-directive="name"`: containers and leaves as a `div`, inline
 * directives as a `span`. An `id` or `class` attribute is the element's; any
 * other attribute is a `data-` attribute. A bare attribute such as `{draft}`
 * has the value `""`.
 */
export const directives = (): Preset => ({
  remark: [remarkDirective, mark],
});
