import type { Source } from "@prosary/core";
import type { Contract, Document, Kind, Node, Role } from "@prosary/schema";
import type {
  ElementContent,
  Handler,
  Handlers,
  Part,
  Renderer,
  Root,
  Styled,
} from "./types";

import { remap } from "objectively";
import { toHtml } from "hast-util-to-html";

import { UncoveredKindError } from "./error";
import { standard } from "./standard";

/**
 * Makes the `data-*` property name of an attribute, as hast spells it:
 * `kind` becomes `dataKind`, which serializes as `data-kind`.
 */
const dataName = (attribute: string): string =>
  `data${attribute.charAt(0).toUpperCase()}${attribute.slice(1)}`;

/**
 * Makes a {@link Renderer} over a source and a style. The renderer has one
 * handler per kind of the contract. A kind without a given handler takes the
 * standard handler of its mdast type, or a `div` or `span` for a directive.
 * Throws {@link UncoveredKindError} when a kind has neither.
 *
 * Each output reads the source at call time. `html()` and `tree()` render the
 * active document of an id. `sheet()` writes the stylesheet of the style. The
 * renderer never writes a `style` attribute: each element carries the class of
 * its kind, the classes of its roles, and one `data-*` attribute per enum
 * attribute, and the stylesheet binds them.
 *
 * @param source - The store, or another source of active documents.
 * @param style - The checked style, from `defineStyle`.
 * @param handlers - The handlers of the kinds that need one of their own.
 */
export const defineRenderer = <C extends Contract>(
  source: Source<C>,
  style: Styled<C>,
  handlers: Partial<Handlers<C>> = {},
): Renderer<C> => {
  const { schema } = style;
  const { enums } = schema.meta;

  /* One handler per kind: the given one, else the standard one. The check
     for a kind with neither runs first, so the table builder can rely on one
     being there. */
  const resolve = <K extends Kind<C>>(kind: K): Handler<C, K> | undefined =>
    handlers[kind] ?? standard(schema, kind);
  const uncovered = [...enums.kinds].filter(
    (kind) => resolve(kind) === undefined,
  );
  if (uncovered.length > 0) {
    throw new UncoveredKindError(uncovered);
  }
  const table = remap<C["kinds"], Handlers<C>>(
    schema.base.kinds,
    <K extends Kind<C>>(_definition: C["kinds"][K], kind: K): Handler<C, K> => {
      const handler = resolve(kind);
      if (handler === undefined) {
        throw new UncoveredKindError([kind]);
      }
      return handler;
    },
  );

  /* The enum attributes of each kind, for the `data-*` properties. */
  const variants: Partial<Record<Kind<C>, string[]>> = {};
  for (const kind of enums.kinds) {
    variants[kind] = Object.entries(schema.base.kinds[kind]?.attributes ?? {})
      .filter(([, attribute]) => attribute.type === "enum")
      .map(([name]) => name);
  }

  /* Builds the part of a node: its rendered children, its classes, and its
     variant data. */
  const partOf = (
    node: Node<C>,
    children: ElementContent[],
  ): Part<C, Kind<C>> => {
    const kind = node.data.kind;
    const className = style.className(kind);
    const role = (name: Role<C, Kind<C>>): string => style.role(kind, name);
    const roles = schema.base.kinds[kind]?.roles ?? [];
    const data: Record<string, string> = {};
    const attributes: Record<string, unknown> = node.data.attributes;
    for (const name of variants[kind] ?? []) {
      const value = attributes[name];
      if (typeof value === "string") {
        data[dataName(name)] = value;
      }
    }
    return {
      children,
      className,
      role,
      classes: [className, ...roles.map((name) => style.role(kind, name))],
      data,
    };
  };

  /* Renders a list of nodes in order. A handler can return one content or
     several. An element the handler made for the node takes the position of
     the node when it has none. */
  const renderNodes = (nodes: Node<C>[]): ElementContent[] => {
    const out: ElementContent[] = [];
    for (const node of nodes) {
      const handler: Handler<C, Kind<C>> = table[node.data.kind];
      const children = node.children ? renderNodes(node.children) : [];
      const made = handler(node, partOf(node, children));
      for (const content of Array.isArray(made) ? made : [made]) {
        if (
          content.type === "element" &&
          content.position === undefined &&
          node.position !== undefined
        ) {
          content.position = node.position;
        }
        out.push(content);
      }
    }
    return out;
  };

  const render = (document: Document<C>): Root => ({
    type: "root",
    children: renderNodes(document.children),
  });

  const tree = (id: string): Root => render(source.document(id));

  return {
    source,
    style,
    handlers: table,
    document: (id) => source.document(id),
    render,
    tree,
    html: (id) => toHtml(tree(id)),
    sheet: style.sheet,
  };
};
