import type { Preset } from "../types";
import type { Options } from "remark-gfm";

import remarkGfm from "remark-gfm";

/**
 * GitHub Flavored Markdown: tables, task lists, strikethrough, footnotes,
 * and autolinks parse as their nodes and build as their elements.
 *
 * @param options - The options of `remark-gfm`.
 */
export const gfm = (options?: Options): Preset => ({
  remark: [[remarkGfm, options]],
});
