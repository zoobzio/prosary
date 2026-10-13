import type { Contract, Kind, Schema } from "@prosary/schema";
import type { Element, ElementContent, Handler, Marks, Text } from "./types";

import { DIRECTIVE_TAGS, TAGS } from "./constant";

/**
 * What a standard handler receives: the marks and the rendered children.
 */
type Piece = Marks & {
  children: ElementContent[];
};

/**
 * A raw node as a standard handler reads it: by its mdast fields.
 */
type Raw = Record<string, unknown>;

/**
 * Makes a hast element with the classes and the data of its marks.
 */
export const element = (
  tagName: string,
  marks: Marks,
  children: ElementContent[],
  properties: Record<string, string | number | boolean> = {},
): Element => ({
  type: "element",
  tagName,
  properties: { className: marks.classes, ...marks.data, ...properties },
  children,
});

/**
 * Makes a hast text node.
 */
export const text = (value: string): Text => ({ type: "text", value });

/**
 * Reads a string field of a raw node, or `undefined`.
 */
const string = (node: Raw, field: string): string | undefined => {
  const value = node[field];
  return typeof value === "string" ? value : undefined;
};

/**
 * Reads a number field of a raw node, or `undefined`.
 */
const number = (node: Raw, field: string): number | undefined => {
  const value = node[field];
  return typeof value === "number" ? value : undefined;
};

/**
 * Clamps a heading depth to the six HTML heading levels.
 */
const level = (depth: number | undefined): number =>
  Math.min(6, Math.max(1, depth ?? 1));

/**
 * The handlers of the standard mdast node types with a structure of their
 * own, by type. Each renders the semantic HTML of the type, with the classes
 * and the data of the piece on the outer element.
 */
const STANDARD: Record<string, (node: Raw, piece: Piece) => ElementContent> = {
  text: (node) => text(string(node, "value") ?? ""),
  inlineCode: (node, piece) =>
    element("code", piece, [text(string(node, "value") ?? "")]),
  heading: (node, piece) =>
    element(`h${level(number(node, "depth"))}`, piece, piece.children),
  link: (node, piece) => {
    const title = string(node, "title");
    return element("a", piece, piece.children, {
      href: string(node, "url") ?? "",
      ...(title === undefined ? {} : { title }),
    });
  },
  image: (node, piece) => {
    const title = string(node, "title");
    return element("img", piece, [], {
      src: string(node, "url") ?? "",
      alt: string(node, "alt") ?? "",
      ...(title === undefined ? {} : { title }),
    });
  },
  code: (node, piece) => {
    const lang = string(node, "lang");
    const inner: Element = {
      type: "element",
      tagName: "code",
      properties: lang === undefined ? {} : { className: [`language-${lang}`] },
      children: [text(string(node, "value") ?? "")],
    };
    return element("pre", piece, [inner]);
  },
  list: (node, piece) => {
    const ordered = node.ordered === true;
    const start = number(node, "start");
    return element(ordered ? "ol" : "ul", piece, piece.children, {
      ...(ordered && start !== undefined && start !== 1 ? { start } : {}),
    });
  },
  listItem: (node, piece) => {
    const checked = node.checked;
    return element("li", piece, piece.children, {
      ...(typeof checked === "boolean" ? { dataChecked: String(checked) } : {}),
    });
  },
  table: (_node, piece) => {
    const [head, ...body] = piece.children;
    const children: ElementContent[] = [];
    if (head !== undefined) {
      if (head.type === "element") {
        for (const cell of head.children) {
          if (cell.type === "element" && cell.tagName === "td") {
            cell.tagName = "th";
          }
        }
      }
      children.push({
        type: "element",
        tagName: "thead",
        properties: {},
        children: [head],
      });
    }
    if (body.length > 0) {
      children.push({
        type: "element",
        tagName: "tbody",
        properties: {},
        children: body,
      });
    }
    return element("table", piece, children);
  },
};

/**
 * Builds the default handler of a kind from its match. A kind that matches a
 * standard mdast type gets the handler of that type. A kind that matches a
 * directive gets a `div` or a `span`, by the directive type of the node and
 * then by the level of the kind. Returns `undefined` for a type with no
 * standard handler.
 *
 * @param schema - The schema of the contract.
 * @param kind - The kind.
 */
export const standard = <C extends Contract, K extends Kind<C>>(
  schema: Schema<C>,
  kind: K,
): Handler<C, K> | undefined => {
  const definition = schema.base.kinds[kind];
  if (definition === undefined) {
    return undefined;
  }
  const match = definition.match;
  if ("directive" in match) {
    const fallback = definition.level === "inline" ? "span" : "div";
    return (node, piece) => {
      const type = typeof node.type === "string" ? node.type : "";
      return element(DIRECTIVE_TAGS[type] ?? fallback, piece, piece.children);
    };
  }
  const simple = TAGS[match.type];
  if (simple !== undefined) {
    return (_node, piece) => element(simple, piece, piece.children);
  }
  const known = STANDARD[match.type];
  if (known === undefined) {
    return undefined;
  }
  return (node, piece) => known(node, piece);
};
