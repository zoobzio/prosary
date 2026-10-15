import type { Preset } from "../types";
import type { Root as Hast } from "hast";
import type { Root as Mdast } from "mdast";
import type { Plugin } from "unified";

import { object } from "objectively";
import remarkFrontmatter from "remark-frontmatter";
import { parse } from "yaml";

/** The parsed frontmatter of a document. The YAML block must be a map. */
export type Matter = Record<string, unknown>;

declare module "mdast" {
  interface RootData {
    /** The parsed frontmatter, when the document has a YAML block. */
    matter?: Matter;
  }
}

declare module "hast" {
  interface RootData {
    /** The parsed frontmatter, when the document has a YAML block. */
    matter?: Matter;
  }
}

declare module "vfile" {
  interface DataMap {
    /** The parsed frontmatter, carried from the Markdown tree to the HTML tree. */
    matter?: Matter;
  }
}

/**
 * Moves the frontmatter from the Markdown tree to its root data, and keeps it
 * on the file for the HTML side. A YAML block that is not a map, or that does
 * not parse, fails the file at the block.
 */
const lift: Plugin<[], Mdast> = () => (tree, file) => {
  const [first] = tree.children;
  if (first?.type !== "yaml") {
    return;
  }
  let matter: unknown;
  try {
    matter = parse(first.value);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw file.fail(`Frontmatter is not valid YAML: ${reason}`, first);
  }
  if (!object(matter)) {
    throw file.fail("Frontmatter must be a YAML map.", first);
  }
  tree.children.shift();
  tree.data = { ...tree.data, matter };
  file.data.matter = matter;
};

/** Puts the frontmatter the Markdown side kept onto the HTML root. */
const carry: Plugin<[], Hast> = () => (tree, file) => {
  if (file.data.matter !== undefined) {
    tree.data = { ...tree.data, matter: file.data.matter };
  }
};

/**
 * YAML frontmatter. A leading `---` block parses as YAML and moves from the
 * tree to `data.matter` on the root, of the Markdown tree and the HTML tree
 * alike. A block that is not a map, or that does not parse, fails the file
 * with the position of the block.
 */
export const matter = (): Preset => ({
  remark: [remarkFrontmatter, lift],
  rehype: [carry],
});
