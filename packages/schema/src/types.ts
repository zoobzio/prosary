import type { Position } from "unist";

import type {
  ATTRIBUTE_TYPES,
  CONTRACT_KEYS,
  DEFINITION_KEYS,
  DIRECTIVE_TYPES,
  LAYER_KEYS,
  LEVELS,
  MODELS,
  OVERRIDE_KEYS,
  PATCH_KEYS,
  REQUIRED_DEFINITION_KEYS,
} from "./constant";

/* ── contract definition ─────────────────────────────────────────────── */

/**
 * The level of a kind. `block` is flow content. `inline` is phrasing content.
 */
export type Level = (typeof LEVELS)[number];

/**
 * A named content model. `none` permits no children. `inline` permits the
 * inline kinds. `block` permits the block kinds.
 */
export type Model = (typeof MODELS)[number];

/**
 * The content model of a kind: a named model or an explicit list of kinds.
 */
export type Content = Model | readonly string[];

/**
 * An attribute type. The type selects the rule and the coercion.
 */
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];

/**
 * A text attribute.
 */
export type StringAttribute = {
  type: "string";
  required?: boolean;
  default?: string;
};

/**
 * A finite number. `min` and `max` bound the value. `integer` requires a
 * whole number.
 */
export type NumberAttribute = {
  type: "number";
  required?: boolean;
  default?: number;
  min?: number;
  max?: number;
  integer?: boolean;
};

/**
 * A flag. A directive attribute with no value coerces to `true`.
 */
export type BooleanAttribute = {
  type: "boolean";
  required?: boolean;
  default?: boolean;
};

/**
 * One of a closed set of strings. The style binds roles per value.
 */
export type EnumAttribute = {
  type: "enum";
  values: readonly string[];
  required?: boolean;
  default?: string;
};

/**
 * A URL. `protocols` lists the permitted schemes. A URL with no scheme passes.
 * The default list is in {@link DEFAULT_PROTOCOLS}.
 */
export type UrlAttribute = {
  type: "url";
  required?: boolean;
  default?: string;
  protocols?: readonly string[];
};

/**
 * A `{name}` reference to a design token. The schema checks the form only.
 */
export type TokenAttribute = {
  type: "token";
  required?: boolean;
  default?: `{${string}}`;
};

/**
 * An attribute definition. An attribute is required unless `required` is
 * `false` or the definition has a `default`.
 */
export type Attribute =
  | StringAttribute
  | NumberAttribute
  | BooleanAttribute
  | EnumAttribute
  | UrlAttribute
  | TokenAttribute;

/**
 * A match on an mdast node type. `where` narrows the match to nodes whose
 * fields equal the given values. A value in an array matches any member.
 */
export type TypeMatch = {
  type: string;
  where?: Record<string, unknown>;
};

/**
 * A match on a directive by name. The match accepts a container, a leaf, or a
 * text directive with that name.
 */
export type DirectiveMatch = {
  directive: string;
};

/**
 * What a kind claims in the tree.
 */
export type Match = TypeMatch | DirectiveMatch;

/**
 * A kind definition. A kind has a match, a level, a content model, typed
 * attributes, and style roles.
 */
export type Definition = {
  match: Match;
  level: Level;
  content: Content;
  attributes?: Record<string, Attribute>;
  roles?: readonly string[];
};

/**
 * A contract. The kinds are the vocabulary of a document. `root` is the
 * content model of the document root.
 */
export type Contract = {
  kinds: Record<string, Definition>;
  root?: Content;
};

/* ── names from a contract ───────────────────────────────────────────── */

/**
 * The name of a kind in a contract.
 */
export type Kind<C extends Contract> = keyof C["kinds"] & string;

/**
 * The name of a role of the kind `K` of a contract.
 */
export type Role<
  C extends Contract,
  K extends Kind<C>,
> = C["kinds"][K] extends { roles: readonly (infer R extends string)[] }
  ? R
  : never;

/* ── attributes ──────────────────────────────────────────────────────── */

/**
 * The value type of an attribute definition.
 */
export type Value<A> = A extends EnumAttribute
  ? A["values"][number]
  : A extends NumberAttribute
    ? number
    : A extends BooleanAttribute
      ? boolean
      : A extends TokenAttribute
        ? `{${string}}`
        : A extends StringAttribute | UrlAttribute
          ? string
          : never;

/**
 * Whether a bound attribute can be absent. An attribute is absent only when
 * `required` is `false` and the definition has no `default`.
 */
export type Optional<A> = A extends { required: false }
  ? A extends { default: unknown }
    ? false
    : true
  : false;

/**
 * The attribute definitions of a kind, or an empty record.
 */
export type Declared<C extends Contract, K extends Kind<C>> =
  C["kinds"][K]["attributes"] extends Record<string, Attribute>
    ? C["kinds"][K]["attributes"]
    : Record<never, never>;

/**
 * The bound attributes of the kind `K`. Each declared attribute has its value
 * type. An optional attribute can be absent.
 */
export type Attributes<C extends Contract, K extends Kind<C>> = {
  [
    N in keyof Declared<C, K> as Optional<Declared<C, K>[N]> extends true
      ? never
      : N
  ]: Value<Declared<C, K>[N]>;
} & {
  [
    N in keyof Declared<C, K> as Optional<Declared<C, K>[N]> extends true
      ? N
      : never
  ]?: Value<Declared<C, K>[N]>;
};

/* ── bound tree ──────────────────────────────────────────────────────── */

/**
 * The fields that binding adds to the `data` of a node.
 */
export type Bound<C extends Contract, K extends Kind<C>> = {
  kind: K;
  id: string;
  attributes: Attributes<C, K>;
};

/**
 * A bound node of the kind `K`. The node keeps its mdast fields. `data` holds
 * the resolved kind, the node id, and the validated attributes.
 */
export type Node<C extends Contract, K extends Kind<C> = Kind<C>> = {
  type: string;
  data: Bound<C, K>;
  children?: Node<C>[];
  position?: Position;
} & Record<string, unknown>;

/**
 * A reference string. A reference names a document, a node, or both.
 */
export type Reference = `doc:${string}` | `#${string}`;

/**
 * A parsed reference. At least one member is present.
 */
export type Target = {
  document?: string;
  node?: string;
};

/**
 * A reference found in a node, with the path of the attribute that holds it.
 */
export type Found = {
  target: Target;
  path: string[];
};

/**
 * The outcome of a read of the attributes of one node.
 */
export type Reading = {
  attributes: Record<string, unknown>;
  issues: Issue[];
  references: Found[];
};

/**
 * A bound document. The root keeps its mdast fields. `data` holds the document
 * id and the references the document makes, with any data the root had, such
 * as the frontmatter from the parser.
 */
export type Document<C extends Contract> = {
  type: "root";
  data: {
    id: string;
    references: Target[];
  } & Record<string, unknown>;
  children: Node<C>[];
  position?: Position;
};

/**
 * The options of a document bind.
 */
export type BindOptions = {
  /** The document id. The default is the `id` in the data of the root. */
  id?: string;
};

/* ── overlays ────────────────────────────────────────────────────────── */

/**
 * An override of one node. `attributes` replaces attributes. `children`
 * replaces the children with raw mdast nodes.
 */
export type Override = {
  attributes?: Record<string, unknown>;
  children?: unknown[];
};

/**
 * The overrides of one document, by node id.
 */
export type Overrides = Record<string, Override>;

/**
 * The overrides of many documents, by document id and then by node id.
 */
export type Overlay = Record<string, Overrides>;

/**
 * A partial overlay of the documents. All members are optional. `documents`
 * holds the overrides by document id and node id.
 */
export type Patch = {
  id?: string;
  name?: string;
  documents?: Overlay;
};

/**
 * A {@link Patch} with an identity. A compiled translation is a layer.
 */
export type Layer = Patch & {
  id: string;
  name: string;
};

/* ── validation ──────────────────────────────────────────────────────── */

/**
 * The failure codes of a rule. The generic codes come from the predicate
 * atoms. The document codes come from the bind.
 */
export type Code =
  | "not_string"
  | "empty"
  | "not_member"
  | "not_object"
  | "not_array"
  | "not_number"
  | "not_integer"
  | "not_boolean"
  | "not_reference"
  | "not_url"
  | "css_breakout"
  | "out_of_range"
  | "duplicate"
  | "not_exhaustive"
  | "type_mismatch"
  | "unknown_key"
  | "missing_key"
  | "no_match"
  | "unknown_node"
  | "raw_html"
  | "invalid_attribute"
  | "missing_attribute"
  | "unknown_attribute"
  | "invalid_child"
  | "unknown_reference"
  | "duplicate_id";

/**
 * A validation failure. `code` identifies the failure. `message` is readable
 * text. `path` holds the keys from the root to the failure. `expected` holds
 * what the contract requires. `received` holds the value that failed.
 */
export type Issue = {
  code: Code;
  message: string;
  path?: string[];
  expected?: unknown;
  received?: unknown;
};

/**
 * A validation rule. The rule returns an {@link Issue} for an invalid value.
 * The rule returns `undefined` for a valid value.
 */
export type Rule = (v: unknown) => Issue | undefined;

/**
 * The outcome of a bind or an inspect. A success result holds the value. A
 * failure result holds every issue.
 */
export type Result<V> =
  | { success: true; data: V }
  | { success: false; issues: Issue[] };

/**
 * The kinds of validation. Each kind maps to the type that a value of the kind
 * narrows to.
 */
export type Domain<C extends Contract> = {
  contract: Contract;
  kind: Kind<C>;
  reference: Reference;
  override: Override;
  patch: Patch;
  layer: Layer;
  node: Node<C>;
  document: Document<C>;
};

/**
 * The name of a validation kind. A name is a key of {@link Domain}.
 */
export type Validation = keyof Domain<Contract>;

/**
 * A directive node type.
 */
export type DirectiveType = (typeof DIRECTIVE_TYPES)[number];

/**
 * A member of a patch.
 */
export type PatchKey = (typeof PATCH_KEYS)[number];

/**
 * A member that a layer must have.
 */
export type LayerKey = (typeof LAYER_KEYS)[number];

/**
 * A member of an override.
 */
export type OverrideKey = (typeof OVERRIDE_KEYS)[number];

/**
 * A member of a contract.
 */
export type ContractKey = (typeof CONTRACT_KEYS)[number];

/**
 * A member of a kind definition.
 */
export type DefinitionKey = (typeof DEFINITION_KEYS)[number];

/**
 * A member that every kind definition must have.
 */
export type RequiredDefinitionKey = (typeof REQUIRED_DEFINITION_KEYS)[number];

/* ── meta ────────────────────────────────────────────────────────────── */

/**
 * The sets that the schema reads. The contract members come from the kinds.
 * The specification members are the same for every contract.
 */
export type Enum<C extends Contract> = {
  kinds: Set<Kind<C>>;
  inline: Set<Kind<C>>;
  block: Set<Kind<C>>;
  types: Map<string, Kind<C>[]>;
  directives: Map<string, Kind<C>>;
  levels: Set<Level>;
  models: Set<Model>;
  attributeTypes: Set<AttributeType>;
  directiveTypes: Set<DirectiveType>;
  contractKeys: Set<ContractKey>;
  definitionKeys: Set<DefinitionKey>;
  requiredDefinitionKeys: Set<RequiredDefinitionKey>;
  patchKeys: Set<PatchKey>;
  layerKeys: Set<LayerKey>;
  overrideKeys: Set<OverrideKey>;
};

/**
 * The runtime form of one attribute. `type` is the declared attribute type.
 * `rule` checks a present value. `coerce`
 * converts the string form of a directive attribute. A missing value takes
 * `default`, or fails when `required` is `true`.
 */
export type Slot = {
  type: AttributeType;
  rule: Rule;
  required: boolean;
  default?: unknown;
  coerce: (v: unknown) => unknown;
};

/**
 * The runtime form of one kind. `attributes` has a slot per declared
 * attribute. `permitted` is the set of kinds the content model admits, or
 * `undefined` for a kind with no children. `directive` marks a kind that reads
 * its attributes from the `attributes` of a directive node.
 */
export type KindShape<C extends Contract> = {
  attributes: Record<string, Slot>;
  permitted: Set<Kind<C>> | undefined;
  directive: boolean;
};

/**
 * The runtime form of every kind, and the permitted kinds of the root.
 */
export type Shape<C extends Contract> = {
  kinds: { [K in Kind<C>]: KindShape<C> };
  root: Set<Kind<C>>;
};

/**
 * The bind functions. Each returns every issue.
 *
 * - `document` binds a raw root.
 * - `node` binds one raw node and its subtree without a parent.
 * - `override` applies an override to a bound node. The attributes merge over
 *   the attributes of the node and pass the rules of its kind. The children
 *   bind under the content model and the id of the node.
 * - `overrides` checks a map of overrides by node id against a bound
 *   document. Each id must name a node of the document. Each override must
 *   apply to its node.
 */
export type Bind<C extends Contract> = {
  document: (v: unknown, options?: BindOptions) => Result<Document<C>>;
  node: (v: unknown) => Result<Node<C>>;
  override: (node: Node<C>, override: Override) => Result<Node<C>>;
  overrides: (document: Document<C>, v: unknown) => Result<Overrides>;
};

/**
 * A list of {@link Rule}s for each validation kind.
 */
export type Rules = { [V in Validation]: Rule[] };

/**
 * The validation core of a contract: the sets, the kind shapes, the bind, and
 * the rules.
 */
export type Meta<C extends Contract> = {
  enums: Enum<C>;
  shape: Shape<C>;
  bind: Bind<C>;
  rules: Rules;
};

/* ── bundles ─────────────────────────────────────────────────────────── */

/**
 * A boolean type predicate for each validation kind.
 */
export type Check<C extends Contract> = {
  [V in Validation]: (v: unknown) => v is Domain<C>[V];
};

/**
 * An assertion for each validation kind. The assertion throws a `SchemaError`
 * that holds every issue.
 */
export type Assert<C extends Contract> = {
  contract: (v: unknown) => asserts v is Contract;
  kind: (v: unknown) => asserts v is Kind<C>;
  reference: (v: unknown) => asserts v is Reference;
  override: (v: unknown) => asserts v is Override;
  patch: (v: unknown) => asserts v is Patch;
  layer: (v: unknown) => asserts v is Layer;
  node: (v: unknown) => asserts v is Node<C>;
  document: (v: unknown) => asserts v is Document<C>;
};

/**
 * A parse for each validation kind. The parse asserts the value and returns it
 * with the type of its kind. `node` and `document` return the bound tree.
 */
export type Parse<C extends Contract> = {
  [V in Validation]: (v: unknown) => Domain<C>[V];
};

/**
 * An inspect for each validation kind. The inspect returns a {@link Result}.
 */
export type Inspect<C extends Contract> = {
  [V in Validation]: (v: unknown) => Result<Domain<C>[V]>;
};

/**
 * The bundle that `defineContract` returns. `base` is the contract. `meta` is
 * the validation core. `bind` binds a raw tree with every issue. The other
 * members are the validation bundles.
 */
export type Schema<C extends Contract> = {
  base: C;
  meta: Meta<C>;
  bind: Bind<C>["document"];
  check: Check<C>;
  assert: Assert<C>;
  parse: Parse<C>;
  inspect: Inspect<C>;
};
