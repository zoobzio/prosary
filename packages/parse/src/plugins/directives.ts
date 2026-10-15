import type { Preset } from "../types";
import type { Directives } from "mdast-util-directive";
import type { Root, Text } from "mdast";
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

/**
 * The characters an inline directive may follow, besides whitespace and the
 * start of the input: the openers that wrap a word.
 */
const OPENERS = new Set(["[", "*", "_", "("]);

/** The property name of a data attribute: `data-x` style, from the attribute's name. */
const data = (name: string): string => {
  return `data${name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}`;
};

/**
 * Restores the inline directives that are prose. `remark-directive` reads
 * `:name` wherever it stands: `10:30`, `John 3:16` and `key:value` each
 * lose their colon and the word after it to an empty directive. An inline
 * directive here begins a word, as it does in MDC: it follows whitespace,
 * the start of the input or an opener (`[`, `*`, `_`, `(`), and its name
 * starts with something other than a digit. Any other match is put back as
 * the text it was written as, joined to the text around it.
 */
const restore: Plugin<[], Root> = () => (tree, file) => {
  const source = String(file);
  visit(tree, "textDirective", (node, index, parent) => {
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (
      index === undefined ||
      parent === undefined ||
      start === undefined ||
      end === undefined
    ) {
      return;
    }
    const before = start === 0 ? " " : source.charAt(start - 1);
    const glued = !/\s/.test(before) && !OPENERS.has(before);
    const numeric = /^[0-9]/.test(node.name);
    if (!glued && !numeric) {
      return;
    }
    let from = index;
    let to = index + 1;
    let value = source.slice(start, end);
    const previous = parent.children[index - 1];
    const next = parent.children[index + 1];
    if (previous?.type === "text") {
      value = previous.value + value;
      from = index - 1;
    }
    if (next?.type === "text") {
      value = value + next.value;
      to = index + 2;
    }
    const text: Text = {
      type: "text",
      value,
      position: {
        start: parent.children[from]!.position!.start,
        end: parent.children[to - 1]!.position!.end,
      },
    };
    parent.children.splice(from, to - from, text);
    return from;
  });
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
 *
 * An inline directive begins a word: it follows whitespace, the start of the
 * input or an opener (`[`, `*`, `_`, `(`), and its name does not start with
 * a digit. A colon inside a word, as in `10:30` or `key:value`, is text.
 */
export const directives = (): Preset => ({
  remark: [remarkDirective, restore, mark],
});
