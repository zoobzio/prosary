import type { Root } from "mdast";
import type { Plugin } from "unified";

import { visit } from "unist-util-visit";

import { HEADING_ID } from "./constant";

/**
 * Reads an explicit id from the end of a heading, as in `## Install {#install}`.
 * The plugin removes the marker from the last text node of the heading and
 * sets `data.id`. A heading with no marker is not changed.
 */
export const remarkHeadingId: Plugin<[], Root> = () => (tree) => {
  visit(tree, "heading", (heading) => {
    const last = heading.children.at(-1);
    if (last === undefined || last.type !== "text") {
      return;
    }
    const found = HEADING_ID.exec(last.value);
    if (found === null) {
      return;
    }
    const id = found[1];
    if (id === undefined) {
      return;
    }
    const rest = last.value.slice(0, found.index).trimEnd();
    if (rest === "") {
      heading.children.pop();
    } else {
      last.value = rest;
    }
    heading.data = { ...heading.data, id };
  });
};
