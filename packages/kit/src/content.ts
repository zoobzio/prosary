import type { Root as Hast } from "hast";
import type { Root as Mdast } from "@prosary/parse";
import type { ContentOutput } from "./types";

import { toHtml } from "hast-util-to-html";
import { toHast } from "mdast-util-to-hast";
import { ParseError, defineParser } from "@prosary/parse";

import { InvalidDocumentError } from "./error";

/** The extension a built document takes, by its form. */
const EXTENSIONS: Record<ContentOutput, string> = {
  md: ".md",
  mdast: ".json",
  hast: ".json",
  html: ".html",
};

/**
 * The path a document is built to, from its path under the content directory:
 * the same path, with the extension of the form.
 *
 * @param path - The document's posix path.
 * @param output - The form the document is built in.
 */
export const contentPath = (path: string, output: ContentOutput): string => {
  return path.replace(/\.md$/, EXTENSIONS[output]);
};

/** A tree as JSON, compact, with the positions left out. */
const json = (tree: unknown): string => {
  return `${JSON.stringify(tree, (key, value: unknown) => (key === "position" ? undefined : value))}\n`;
};

/** The one parser every document goes through. */
const parser = defineParser();

/**
 * Builds a Markdown document into the form the config asks for. The Markdown
 * form is the document as written. The others parse it: the mdast form is
 * that tree, the hast form is the tree turned to HTML nodes, and the html
 * form is those nodes as a string. Frontmatter rides on the root of either
 * tree as `data.matter`.
 *
 * @param document - The Markdown document.
 * @param output - The form to build it in.
 * @param path - The document's file, to name it in an error.
 * @throws InvalidDocumentError when the frontmatter does not parse.
 */
export const buildDocument = (
  document: string,
  output: ContentOutput,
  path: string,
): string => {
  if (output === "md") {
    return document;
  }
  let tree: Mdast;
  try {
    tree = parser.parse(document);
  } catch (error) {
    if (error instanceof ParseError) {
      const at = error.position
        ? ` at ${error.position.start.line}:${error.position.start.column}`
        : "";
      throw new InvalidDocumentError(
        path,
        `could not be parsed: ${error.message}${at}`,
        { cause: error },
      );
    }
    throw error;
  }
  if (output === "mdast") {
    return json(tree);
  }
  const hast = toHast(tree);
  if (hast.type !== "root") {
    throw new InvalidDocumentError(path, "did not build to a root node");
  }
  if (tree.data !== undefined) {
    hast.data = { ...hast.data, ...tree.data };
  }
  if (output === "hast") {
    return json(hast as Hast);
  }
  return toHtml(hast);
};
