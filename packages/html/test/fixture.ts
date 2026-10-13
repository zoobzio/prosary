import type { Contract, Document } from "@prosary/schema";
import type { Handler, Style } from "../src/types";

import { makeProsary } from "@prosary/core";
import { defineParser } from "@prosary/parse";
import { defineContract } from "@prosary/schema";

import { element, text } from "../src/standard";

/**
 * A contract for the test suites: the standard kinds the source uses, a
 * container directive with roles and an enum attribute, a text directive, and
 * a leaf directive.
 */
export const contract = {
  kinds: {
    text: { match: { type: "text" }, level: "inline", content: "none" },
    emphasis: {
      match: { type: "emphasis" },
      level: "inline",
      content: "inline",
      roles: ["text"],
    },
    strong: { match: { type: "strong" }, level: "inline", content: "inline" },
    delete: { match: { type: "delete" }, level: "inline", content: "inline" },
    inlineCode: {
      match: { type: "inlineCode" },
      level: "inline",
      content: "none",
    },
    break: { match: { type: "break" }, level: "inline", content: "none" },
    link: {
      match: { type: "link" },
      level: "inline",
      content: "inline",
      attributes: { url: { type: "url", protocols: ["https", "doc"] } },
      roles: ["text"],
    },
    image: { match: { type: "image" }, level: "inline", content: "none" },
    badge: {
      match: { directive: "badge" },
      level: "inline",
      content: "inline",
      attributes: {
        tone: { type: "enum", values: ["info", "danger"], default: "info" },
      },
      roles: ["surface"],
    },
    heading: {
      match: { type: "heading" },
      level: "block",
      content: "inline",
      attributes: { depth: { type: "number", min: 1, max: 6 } },
      roles: ["text"],
    },
    paragraph: {
      match: { type: "paragraph" },
      level: "block",
      content: "inline",
      roles: ["text"],
    },
    blockquote: {
      match: { type: "blockquote" },
      level: "block",
      content: "block",
      roles: ["border", "text"],
    },
    code: {
      match: { type: "code" },
      level: "block",
      content: "none",
      roles: ["surface"],
    },
    list: { match: { type: "list" }, level: "block", content: ["listItem"] },
    listItem: { match: { type: "listItem" }, level: "block", content: "block" },
    thematicBreak: {
      match: { type: "thematicBreak" },
      level: "block",
      content: "none",
    },
    table: { match: { type: "table" }, level: "block", content: ["tableRow"] },
    tableRow: {
      match: { type: "tableRow" },
      level: "block",
      content: ["tableCell"],
    },
    tableCell: {
      match: { type: "tableCell" },
      level: "block",
      content: "inline",
    },
    callout: {
      match: { directive: "callout" },
      level: "block",
      content: "block",
      attributes: {
        kind: { type: "enum", values: ["note", "warning"], default: "note" },
        title: { type: "string", required: false },
      },
      roles: ["border", "marker", "text"],
    },
    rule: {
      match: { directive: "rule" },
      level: "block",
      content: "none",
      roles: ["border"],
    },
  },
} as const satisfies Contract;

export type C = typeof contract;

/** The schema of the fixture contract. */
export const schema = defineContract(contract);

/** A style over the fixture: declarations, a bound class, and a variant. */
export const style = {
  paragraph: {
    roles: { text: { color: "var(--color-ink)", font: "var(--type-body)" } },
  },
  blockquote: {
    roles: {
      border: { "border-left": "3px solid var(--color-accent)" },
      text: "prose-quote",
    },
  },
  callout: {
    roles: {
      border: { border: "1px solid var(--color-line)" },
      marker: { color: "var(--color-accent)" },
    },
    variants: {
      kind: {
        warning: {
          border: { "border-color": "var(--color-warn)" },
          marker: { color: "var(--color-warn)" },
        },
      },
    },
  },
} as const satisfies Style<C>;

/** A handler for the callout: an aside with a marker before the content. */
export const callout: Handler<C, "callout"> = (node, part) =>
  element(
    "aside",
    { classes: [part.className, part.role("border")], data: part.data },
    [
      element("span", { classes: [part.role("marker")], data: {} }, [
        text(node.data.attributes.title ?? node.data.attributes.kind),
      ]),
      element("div", { classes: [part.role("text")], data: {} }, part.children),
    ],
  );

const { parse } = defineParser();

/** Parses and binds a Markdown source. */
export const document = (source: string): Document<C> =>
  schema.parse.document(parse(source));

/** The guide: every standard kind, a callout, a badge, and a rule. */
export const guide = document(`---
id: guide
---

# Setup Guide {#setup}

Read the [intro](doc:intro#start) and *note* **this** ~~gone~~ \`code\` :badge[new]{tone=danger}.

> Quoted a < b & c text.

:::callout{kind="warning" title="Careful"}
Mind the gap.
:::

::rule

- one
- two

1. first
2. second

| Name | Value |
| ---- | ----- |
| a    | 1     |

\`\`\`ts
let x = 1;
\`\`\`

---

![Alt text](https://example.com/a.png "Title")
`);

/** A store over the guide. */
export const store = () =>
  makeProsary(schema, { documents: { guide }, patch: {} });
