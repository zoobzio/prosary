/**
 * The default prefix of the class names the renderer writes. A kind `callout`
 * gets the class `p-callout`. A role `border` of that kind gets the class
 * `p-callout-border`.
 */
export const PREFIX = "p";

/**
 * Matches the sequences that can end a CSS declaration or a rule, start a
 * comment, close a tag, or fetch a resource. A style value or a property with
 * one of them is rejected, so `sheet()` emits without escape surprises.
 */
export const CSS_BREAKOUT = /[;{}\\]|\/\*|<\/|\burl\(/i;

/**
 * Matches a class name that the renderer accepts from a style: a letter or an
 * underscore, then letters, digits, `-`, and `_`.
 */
export const CLASS_NAME = /^[A-Za-z_][\w-]*$/;

/**
 * Matches a CSS property name: a letter or `-`, then letters, digits, and `-`.
 * A custom property such as `--accent` passes.
 */
export const PROPERTY_NAME = /^-?-?[A-Za-z][\w-]*$/;

/**
 * The HTML tag of each standard mdast node type that renders as one element.
 * The types with a structure of their own, such as `heading` and `code`, have
 * their own handlers.
 */
export const TAGS: Record<string, string> = {
  paragraph: "p",
  blockquote: "blockquote",
  emphasis: "em",
  strong: "strong",
  delete: "del",
  tableRow: "tr",
  tableCell: "td",
  thematicBreak: "hr",
  break: "br",
};

/**
 * The HTML tag of each directive node type when a kind has no handler of its
 * own.
 */
export const DIRECTIVE_TAGS: Record<string, string> = {
  containerDirective: "div",
  leafDirective: "div",
  textDirective: "span",
};
