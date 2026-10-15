import type { Preset } from "../types";
import type { Parent, Root } from "mdast";
import type { Plugin } from "unified";

import remarkMdc from "remark-mdc";
import { visit } from "unist-util-visit";

import type {} from "mdast-util-to-hast";

/**
 * The property that marks an element built from a component and names the
 * component: `data-directive` in HTML, the same marker the `directives`
 * preset sets.
 */
const MARKER = "dataDirective";

/** The property that names the slot a section fills: `data-slot` in HTML. */
const SLOT = "dataSlot";

/** A component: a block, or an inline one. */
interface Component extends Parent {
  type: "containerComponent" | "leafComponent" | "textComponent";
  name: string;
  attributes?: Record<string, unknown>;
  fmAttributes?: Record<string, unknown>;
}

/** A named slot of a block component. */
interface Section extends Parent {
  type: "componentContainerSection";
  name: string;
  attributes?: Record<string, unknown>;
}

/** A Markdown node that `{attrs}` followed. */
interface Attributed extends Parent {
  attributes?: Record<string, unknown>;
}

/** The parents an inline component stands in as a block. */
const BLOCKS = new Set([
  "root",
  "containerComponent",
  "componentContainerSection",
  "listItem",
  "blockquote",
]);

/** The property name of a data attribute: `data-x` style, from the attribute's name. */
const data = (name: string): string => {
  return `data${name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}`;
};

/**
 * An attribute's value as a string: a string as it is, `true` (a bare
 * attribute) as `""`, a number as its digits, anything else as JSON. A
 * missing or false value is no attribute.
 */
const text = (value: unknown): string | undefined => {
  if (value === null || value === undefined || value === false) {
    return undefined;
  }
  if (typeof value === "string") {
    return value;
  }
  if (value === true) {
    return "";
  }
  if (typeof value === "number") {
    return String(value);
  }
  return JSON.stringify(value);
};

/**
 * The properties of an element from its attributes. An `id` or `class` is
 * the element's. Any other attribute is a `data-` attribute when `marked`,
 * as on a component, and the attribute as written otherwise, as on a
 * Markdown element.
 */
const properties = (
  attributes: Record<string, unknown>,
  marked: boolean,
): Record<string, string | string[]> => {
  const hProperties: Record<string, string | string[]> = {};
  for (const [name, raw] of Object.entries(attributes)) {
    const value = text(raw);
    if (value === undefined) {
      continue;
    }
    if (name === "id") {
      hProperties.id = value;
    } else if (name === "class") {
      hProperties.className = value.split(/\s+/).filter(Boolean);
    } else {
      hProperties[marked ? data(name) : name] = value;
    }
  }
  return hProperties;
};

/**
 * Names the element each component, slot and attributed node builds and
 * its properties.
 */
const mark: Plugin<[], Root> = () => (tree) => {
  visit(tree, (node, _index, parent) => {
    const type: string = node.type;
    if (
      type === "containerComponent" ||
      type === "leafComponent" ||
      type === "textComponent"
    ) {
      const component = node as unknown as Component;
      const attributes = { ...component.attributes, ...component.fmAttributes };
      const block =
        component.type !== "textComponent" ||
        (parent !== undefined && BLOCKS.has(parent.type));
      if (component.name === "span") {
        component.data = {
          hName: "span",
          hProperties: properties(attributes, false),
        };
        return;
      }
      const hProperties = properties(attributes, true);
      hProperties[MARKER] = component.name;
      component.data = { hName: block ? "div" : "span", hProperties };
      return;
    }
    if (type === "componentContainerSection") {
      const section = node as unknown as Section;
      const hProperties = properties(section.attributes ?? {}, true);
      hProperties[SLOT] = section.name;
      section.data = { hName: "div", hProperties };
      return;
    }
    const attributed = node as Attributed;
    if (attributed.attributes !== undefined) {
      attributed.data = {
        ...attributed.data,
        hProperties: properties(attributed.attributes, false),
      };
    }
  });
};

/**
 * MDC, the component syntax of Nuxt Content, as
 * [`remark-mdc`](https://github.com/nuxtlabs/remark-mdc) reads it, built as
 * the same marked elements the `directives` preset builds. `::name{attrs}`
 * … `::` is a block, nested with more colons; `:name[text]{attrs}` is
 * inline, and a block when it stands alone on a line. Each builds as an
 * element marked with `data-directive="name"`: a block as a `div`, an inline
 * component as a `span`. An `id` or `class` attribute is the element's; any
 * other attribute, and any prop from a YAML block, is a `data-` attribute.
 * A bare attribute such as `{draft}` has the value `""`.
 *
 * A `#name` slot inside a block builds as a `div` carrying
 * `data-slot="name"`. A `[text]{attrs}` span builds as a plain `span`, and
 * `{attrs}` after a link, image, emphasis or code sets the attributes of
 * that element. A `{{ binding }}` builds as a `binding` component with its
 * expression in `data-value`.
 *
 * MDC reads an inline component only at the start of a word and only with
 * a name that starts with a letter, so a colon inside a word, as in `10:30`
 * or `key:value`, is text.
 */
export const mdc = (): Preset => ({
  remark: [remarkMdc, mark],
});
