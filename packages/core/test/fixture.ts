import type { Contract, Document } from "@prosary/schema";

import { defineParser } from "@prosary/parse";
import { defineContract } from "@prosary/schema";

/**
 * A contract for the test suites: the standard kinds the sources use, a
 * container directive with typed attributes, and a leaf directive.
 */
export const contract = {
  kinds: {
    text: {
      match: { type: "text" },
      level: "inline",
      content: "none",
      attributes: { value: { type: "string" } },
    },
    emphasis: {
      match: { type: "emphasis" },
      level: "inline",
      content: "inline",
    },
    link: {
      match: { type: "link" },
      level: "inline",
      content: "inline",
      attributes: {
        url: { type: "url", protocols: ["https", "doc"] },
        title: { type: "string", required: false },
      },
    },
    heading: {
      match: { type: "heading" },
      level: "block",
      content: "inline",
      attributes: { depth: { type: "number", min: 1, max: 3 } },
    },
    paragraph: {
      match: { type: "paragraph" },
      level: "block",
      content: "inline",
    },
    callout: {
      match: { directive: "callout" },
      level: "block",
      content: "block",
      attributes: {
        kind: { type: "enum", values: ["note", "warning"], default: "note" },
      },
    },
    rule: { match: { directive: "rule" }, level: "block", content: "none" },
  },
} as const satisfies Contract;

export type C = typeof contract;

/** The schema of the fixture contract. */
export const schema = defineContract(contract);

const { parse } = defineParser();

/** Parses and binds a Markdown source into a document. */
export const document = (source: string): Document<C> =>
  schema.parse.document(parse(source));

/** The English guide: a heading with an explicit id, a paragraph, a callout. */
export const guide = document(`---
id: guide
---

# Setup Guide {#setup}

Read the [intro](doc:intro#start) first.

:::callout{kind="warning"}
Careful.
:::
`);

/** The intro: a heading with an explicit id and a paragraph. */
export const intro = document(`---
id: intro
---

# Start {#start}

Welcome.
`);

/** A French layer over the guide and the intro. */
export const french = {
  id: "fr",
  name: "French",
  documents: {
    guide: {
      setup: { children: [{ type: "text", value: "Guide d'installation" }] },
      "callout[0]": {
        attributes: { kind: "note" },
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", value: "Attention." }],
          },
        ],
      },
    },
    intro: {
      "paragraph[0]": { children: [{ type: "text", value: "Bienvenue." }] },
    },
  },
};
