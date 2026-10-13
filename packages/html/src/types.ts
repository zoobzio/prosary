import type { Source } from "@prosary/core";
import type {
  Contract,
  Declared,
  Document,
  EnumAttribute,
  Kind,
  Node,
  Role,
  Schema,
  Value,
} from "@prosary/schema";
import type { Element, ElementContent, Root, Text } from "hast";

export type { Element, ElementContent, Root, Text };

/* ── style ───────────────────────────────────────────────────────────── */

/**
 * The CSS declarations of a role: a map from property to value. A value can
 * be a literal or a custom property such as `var(--color-accent)`.
 */
export type Declarations = Record<string, string>;

/**
 * The binding of a role. Declarations give `sheet()` a rule to emit under the
 * class of the role. A class name attaches an existing class to the role, and
 * `sheet()` emits nothing for it.
 */
export type Binding = Declarations | string;

/**
 * The attributes of a kind that have an enum type. Each is a variant axis of
 * the kind.
 */
export type Variant<C extends Contract, K extends Kind<C>> = {
  [N in keyof Declared<C, K>]: Declared<C, K>[N] extends EnumAttribute
    ? N
    : never;
}[keyof Declared<C, K>];

/**
 * The style of one kind. `roles` binds each role. `variants` adds
 * declarations to roles under each value of an enum attribute.
 */
export type KindStyle<C extends Contract, K extends Kind<C>> = {
  roles?: { [R in Role<C, K>]?: Binding };
  variants?: {
    [N in Variant<C, K>]?: {
      [V in Value<Declared<C, K>[N]> & string]?: {
        [R in Role<C, K>]?: Declarations;
      };
    };
  };
};

/**
 * A style: the bindings of the roles of each kind. A kind the style omits
 * keeps its generated class names and gets no rule.
 */
export type Style<C extends Contract> = {
  [K in Kind<C>]?: KindStyle<C, K>;
};

/**
 * The options of a style.
 */
export type StyleOptions = {
  /** The prefix of the generated class names. The default is `p`. */
  prefix?: string;
};

/**
 * A checked style. `schema` is the schema it was checked against. `base` is
 * the style. `prefix` is the class prefix. `className(kind)` gives the class
 * of a kind. `role(kind, role)` gives the class of a role: the bound class
 * name, or the generated one. `sheet()` writes the stylesheet.
 */
export type Styled<C extends Contract> = {
  schema: Schema<C>;
  base: Style<C>;
  prefix: string;
  className: (kind: Kind<C>) => string;
  role: (kind: Kind<C>, role: string) => string;
  sheet: () => string;
};

/* ── handlers ────────────────────────────────────────────────────────── */

/**
 * The classes and the data a handler puts on an element. `element` takes the
 * marks and writes them as the `class` and the `data-*` attributes.
 */
export type Marks = {
  classes: string[];
  data: Record<string, string>;
};

/**
 * What a handler receives beside the node.
 *
 * - `children` are the rendered children of the node, in order.
 * - `className` is the class of the kind.
 * - `role(name)` is the class of a role of the kind.
 * - `classes` is the class of the kind and the classes of every role, for a
 *   handler that renders one element.
 * - `data` holds one `data-*` property per enum attribute, with its value, so
 *   a stylesheet can target a variant.
 *
 * The typed attributes of the node are in `node.data.attributes`.
 */
export type Part<C extends Contract, K extends Kind<C>> = {
  children: ElementContent[];
  className: string;
  role: (name: Role<C, K>) => string;
  classes: string[];
  data: Record<string, string>;
};

/**
 * A handler renders one node of a kind to hast content. The type is written
 * as a method signature so that a handler of one kind is assignable to the
 * handler slot of the union of kinds, which the renderer dispatches on at
 * runtime.
 */
export type Handler<C extends Contract, K extends Kind<C>> = {
  bivariant(
    node: Node<C, K>,
    part: Part<C, K>,
  ): ElementContent | ElementContent[];
}["bivariant"];

/**
 * One handler per kind.
 */
export type Handlers<C extends Contract> = {
  [K in Kind<C>]: Handler<C, K>;
};

/* ── renderer ────────────────────────────────────────────────────────── */

/**
 * The HTML renderer. Each output reads the source at call time.
 */
export type Renderer<C extends Contract> = {
  /** The source the renderer reads. */
  source: Source<C>;
  /** The checked style. */
  style: Styled<C>;
  /** The handler of each kind. */
  handlers: Handlers<C>;
  /** Returns the active document of an id. */
  document: (id: string) => Document<C>;
  /** Renders a bound document to a hast root. */
  render: (document: Document<C>) => Root;
  /** Renders the active document of an id to a hast root. */
  tree: (id: string) => Root;
  /** Renders the active document of an id to an HTML string. */
  html: (id: string) => string;
  /** Returns the stylesheet of the style. */
  sheet: () => string;
};
