import type { Element, Properties, Root, RootContent } from "hast";
import type { VNodeChild } from "vue";

import { find, html } from "property-information";
import { h } from "vue";

import type { Components } from "./types";
import { MARKER } from "./constant";

/** The name a directive's attribute was written with, from its property. */
const written = (property: string): string => {
  const name = property.replace(/^data(?=[A-Z])/, "");
  return name === property
    ? property
    : name.charAt(0).toLowerCase() + name.slice(1);
};

/** A property's value as an attribute's: lists joined as HTML joins them. */
const value = (property: string, given: unknown): unknown => {
  if (!Array.isArray(given)) {
    return given;
  }
  return given.join(find(html, property).commaSeparated ? ", " : " ");
};

/**
 * An element's properties as the props of what renders it. An element gets
 * its attributes by their HTML names (`class`, `for`, `data-kind`), the
 * marker among them. A directive's component gets the attributes the
 * directive was written with (`kind`), the marker left out.
 */
const props = (
  properties: Properties,
  directive: string | undefined,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [property, given] of Object.entries(properties)) {
    if (given === undefined || given === null) {
      continue;
    }
    if (property === MARKER && directive !== undefined) {
      continue;
    }
    const name =
      directive === undefined
        ? find(html, property).attribute
        : written(property);
    result[name] = value(property, given);
  }
  return result;
};

/** What renders an element: the override by directive, then by tag, else the tag. */
const resolve = (
  element: Element,
  components: Components,
): { type: string | Components[string]; directive: string | undefined } => {
  const marker = element.properties[MARKER];
  const directive = typeof marker === "string" ? marker : undefined;
  if (directive !== undefined && components[directive] !== undefined) {
    return { type: components[directive], directive };
  }
  return {
    type: components[element.tagName] ?? element.tagName,
    directive: undefined,
  };
};

const nodes = (
  contents: RootContent[],
  components: Components,
): VNodeChild[] => {
  return contents.flatMap((content) => {
    const child = node(content, components);
    return child === null ? [] : [child];
  });
};

const node = (content: RootContent, components: Components): VNodeChild => {
  switch (content.type) {
    case "text":
      return content.value;
    case "element": {
      const { type, directive } = resolve(content, components);
      const children = nodes(content.children, components);
      if (typeof type === "string") {
        return h(type, props(content.properties, undefined), children);
      }
      return h(type, props(content.properties, directive), {
        default: () => children,
      });
    }
    default:
      return null;
  }
};

/**
 * Renders an HTML tree to vnodes: each element as its tag, or as the
 * component that overrides it, each text node as text. Comments and
 * doctypes render nothing.
 *
 * @param tree - The HTML tree, as the kit builds it.
 * @param components - What renders in place of elements, by tag or directive.
 */
export const render = (
  tree: Root,
  components: Components = {},
): VNodeChild[] => {
  return nodes(tree.children, components);
};
