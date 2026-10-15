import type { Hast, Preset } from "@prosary/parse";
import type { ContentOutput } from "./types";

import { toHtml } from "hast-util-to-html";
import { definePipeline } from "@prosary/parse";
import { visit } from "unist-util-visit";
import { VFileMessage } from "vfile-message";

import { MARKER } from "./constant";
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

/**
 * Builds documents through one pipeline and keeps what it sees: every
 * element the documents build to, and every directive among them.
 */
export interface Builder {
  /**
   * Builds a Markdown document into the form the config asks for. The
   * Markdown form is the document as written. The others go through the
   * pipeline: the mdast form is the Markdown tree, the hast form is the HTML
   * tree, and the html form is that tree as a string. Every document builds
   * to the HTML tree, whatever the form, so every document is checked and
   * counted.
   *
   * @param document - The Markdown document.
   * @param output - The form to build it in.
   * @param path - The document's file, to name it in an error.
   * @throws InvalidDocumentError when the pipeline fails the document.
   */
  build: (document: string, output: ContentOutput, path: string) => string;

  /** The tag name of every element built so far, sorted. */
  elements: () => string[];

  /** The name of every directive built so far, sorted. */
  directives: () => string[];
}

/**
 * Makes a {@link Builder} over the presets the config lists.
 *
 * @param presets - The presets, in order.
 */
export const createBuilder = (presets: Preset[]): Builder => {
  const pipeline = definePipeline({ presets });
  const elements = new Set<string>();
  const directives = new Set<string>();
  const run = <T>(path: string, stage: () => T): T => {
    try {
      return stage();
    } catch (error) {
      if (error instanceof VFileMessage) {
        const at =
          error.line === undefined ? "" : ` at ${error.line}:${error.column}`;
        throw new InvalidDocumentError(
          path,
          `could not be parsed: ${error.reason}${at}`,
          { cause: error },
        );
      }
      throw error;
    }
  };
  const observe = (tree: Hast): void => {
    visit(tree, "element", (element) => {
      elements.add(element.tagName);
      const directive = element.properties[MARKER];
      if (typeof directive === "string") {
        directives.add(directive);
      }
    });
  };
  return {
    build: (document, output, path) => {
      const tree = run(path, () => pipeline.build(document));
      observe(tree);
      switch (output) {
        case "md":
          return document;
        case "mdast":
          return json(run(path, () => pipeline.parse(document)));
        case "hast":
          return json(tree);
        case "html":
          return toHtml(tree);
      }
    },
    elements: () => [...elements].sort(),
    directives: () => [...directives].sort(),
  };
};
