import type { Root } from "mdast";

/**
 * The parsed frontmatter of a document. The YAML block must be a map.
 */
export type Matter = Record<string, unknown>;

declare module "mdast" {
  interface RootData {
    /** The parsed frontmatter, when the document has a YAML block. */
    matter?: Matter;
    /** The document id, when the frontmatter has a string `id`. */
    id?: string;
  }
  interface HeadingData {
    /** The explicit id of the heading, from a trailing `{#id}`. */
    id?: string;
  }
}

/**
 * A parser. `parse` turns Markdown into an mdast tree with the frontmatter on
 * the root data, the directives as directive nodes, and the explicit heading
 * ids on the heading data.
 */
export type Parser = {
  parse: (source: string) => Root;
};

export type { Root };
