import type { Preset } from "../types";
import type { Root } from "mdast";
import type { Plugin } from "unified";

import { visit } from "unist-util-visit";

import type {} from "mdast-util-to-hast";

/**
 * Matches an explicit id at the end of a heading, as in `## Install {#install}`.
 * The id starts with a letter and holds letters, digits, `-`, and `_`. The
 * first group is the id.
 */
const HEADING_ID = /\s*\{#([A-Za-z][\w-]*)\}\s*$/;

/**
 * Reads an explicit id from the end of each heading. The marker leaves the
 * last text node, and the id becomes the `id` of the built element.
 */
const read: Plugin<[], Root> = () => (tree) => {
  visit(tree, "heading", (heading) => {
    const last = heading.children.at(-1);
    if (last === undefined || last.type !== "text") {
      return;
    }
    const found = HEADING_ID.exec(last.value);
    const id = found?.[1];
    if (found === null || id === undefined) {
      return;
    }
    const rest = last.value.slice(0, found.index).trimEnd();
    if (rest === "") {
      heading.children.pop();
    } else {
      last.value = rest;
    }
    heading.data = {
      ...heading.data,
      hProperties: { ...heading.data?.hProperties, id },
    };
  });
};

/**
 * Explicit heading ids. A trailing `{#id}` on a heading leaves the text and
 * becomes the `id` of the heading element. A heading with no marker is not
 * changed.
 */
export const headings = (): Preset => ({ remark: [read] });
