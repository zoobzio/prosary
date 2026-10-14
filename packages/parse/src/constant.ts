/**
 * The mdast node type that `remark-frontmatter` produces for a YAML block.
 */
export const MATTER_TYPE = "yaml";

/**
 * Matches an explicit id at the end of a heading, as in `## Install {#install}`.
 * The id starts with a letter and holds letters, digits, `-`, and `_`. The
 * first group is the id.
 */
export const HEADING_ID = /\s*\{#([A-Za-z][\w-]*)\}\s*$/;
