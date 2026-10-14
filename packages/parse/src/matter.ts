import type { Root } from "mdast";
import type { Plugin } from "unified";

import { object } from "objectively";
import { parse } from "yaml";

import { MATTER_TYPE } from "./constant";
import { ParseError } from "./error";

/**
 * Moves the frontmatter of a document from the tree to the root data. The
 * plugin removes the leading `yaml` node, parses it, and sets `data.matter`.
 * A frontmatter `id` that is a string also sets `data.id`, so the bind takes
 * it as the document id. A YAML block that is not a map, or that does not
 * parse, throws a {@link ParseError}.
 */
export const remarkMatter: Plugin<[], Root> = () => (tree) => {
  const [first] = tree.children;
  if (first === undefined || first.type !== MATTER_TYPE) {
    return;
  }
  let matter: unknown;
  try {
    matter = parse(first.value);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new ParseError(
      `Frontmatter is not valid YAML: ${reason}`,
      first.position,
    );
  }
  if (!object(matter)) {
    throw new ParseError("Frontmatter must be a YAML map.", first.position);
  }
  tree.children.shift();
  tree.data = {
    ...tree.data,
    matter,
    ...(typeof matter.id === "string" ? { id: matter.id } : {}),
  };
};
