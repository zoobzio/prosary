/**
 * The levels of a kind. A block kind is flow content. An inline kind is
 * phrasing content. The level of a kind decides which content models admit it.
 */
export const LEVELS = ["block", "inline"] as const;

/**
 * The named content models of a kind. `none` permits no children. `inline`
 * permits the inline kinds of the contract. `block` permits the block kinds of
 * the contract. A kind can name an explicit list of kinds in place of a model.
 */
export const MODELS = ["none", "inline", "block"] as const;

/**
 * The attribute types that a kind can declare. Each type has a rule and a
 * coercion from the string form of a directive attribute.
 */
export const ATTRIBUTE_TYPES = [
  "string",
  "number",
  "boolean",
  "enum",
  "url",
  "token",
] as const;

/**
 * The mdast node types that `remark-directive` produces. A directive kind
 * matches a node of one of these types by its `name`.
 */
export const DIRECTIVE_TYPES = [
  "containerDirective",
  "leafDirective",
  "textDirective",
] as const;

/**
 * The protocols that a `url` attribute permits when its definition names none.
 */
export const DEFAULT_PROTOCOLS = ["http", "https", "mailto"] as const;

/**
 * The directive attribute that sets the explicit id of a node. The schema
 * reserves the name. A kind cannot declare it.
 */
export const ID_ATTRIBUTE = "id";

/**
 * The mdast node type of raw HTML. The schema rejects a node of this type with
 * its own code when no kind matches it.
 */
export const HTML_TYPE = "html";

/**
 * The mdast node type of the document root.
 */
export const ROOT_TYPE = "root";

/**
 * The mdast node type whose nodes take a slug of their text as their id.
 */
export const HEADING_TYPE = "heading";

/**
 * The prefix of a reference to a document, as in `doc:guide#setup`.
 */
export const REFERENCE_PREFIX = "doc:";

/**
 * The members of a patch. A patch rejects any other key.
 */
export const PATCH_KEYS = ["id", "name", "documents"] as const;

/**
 * The members that a layer must have. The other members in {@link PATCH_KEYS}
 * are optional.
 */
export const LAYER_KEYS = ["id", "name"] as const;

/**
 * The members of an override. An override rejects any other key.
 */
export const OVERRIDE_KEYS = ["attributes", "children"] as const;

/**
 * The members of a contract. A contract rejects any other key.
 */
export const CONTRACT_KEYS = ["kinds", "root"] as const;

/**
 * The members of a kind definition. A definition rejects any other key.
 */
export const DEFINITION_KEYS = [
  "match",
  "level",
  "content",
  "attributes",
  "roles",
] as const;

/**
 * The members that every kind definition must have.
 */
export const REQUIRED_DEFINITION_KEYS = ["match", "level", "content"] as const;
