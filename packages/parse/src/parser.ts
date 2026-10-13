import type { Parser } from "./types";

import remarkDirective from "remark-directive";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

import { remarkHeadingId } from "./heading";
import { remarkMatter } from "./matter";

/**
 * Builds a {@link Parser}. The parser reads CommonMark with the GFM
 * extensions, the directive syntax, and YAML frontmatter. The frontmatter
 * moves to the root data. An explicit `{#id}` at the end of a heading moves to
 * the heading data. The parser keeps the position of each node.
 *
 * The parser does not validate. Pass the tree to the `bind` of a schema.
 */
export const defineParser = (): Parser => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkMatter)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkHeadingId)
    .freeze();
  return {
    parse: (source) => processor.runSync(processor.parse(source)),
  };
};
