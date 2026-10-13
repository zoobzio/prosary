import type { Contract } from "@prosary/schema";

/**
 * A Markdown source for the test suites. The source has frontmatter, a title
 * and a heading with an explicit id, a paragraph with emphasis and two links,
 * a container directive with attributes, a leaf directive, a text directive,
 * a GFM table, and a code block.
 */
export const source = `---
id: guide
title: Setup Guide
tags: [intro, setup]
---

# Setup Guide

## Install {#install}

See [Install](#install) and *note* the [other guide](doc:other#intro) :badge[new]{tone=danger}.

:::callout{kind="warning" draft weight=3}
Careful.
:::

::rule

| Name | Value |
| ---- | ----- |
| a    | 1     |

\`\`\`ts
let x = 1;
\`\`\`
`;

/**
 * A contract that accepts the fixture source, for the integration test with
 * the schema.
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
    badge: {
      match: { directive: "badge" },
      level: "inline",
      content: "inline",
      attributes: {
        tone: { type: "enum", values: ["info", "danger"], default: "info" },
      },
    },
    title: {
      match: { type: "heading", where: { depth: 1 } },
      level: "block",
      content: "inline",
    },
    heading: {
      match: { type: "heading" },
      level: "block",
      content: "inline",
      attributes: { depth: { type: "number", min: 2, max: 3 } },
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
        draft: { type: "boolean", required: false },
        weight: { type: "number", required: false, integer: true },
      },
    },
    rule: { match: { directive: "rule" }, level: "block", content: "none" },
    table: { match: { type: "table" }, level: "block", content: ["row"] },
    row: { match: { type: "tableRow" }, level: "block", content: ["cell"] },
    cell: { match: { type: "tableCell" }, level: "block", content: "inline" },
    code: {
      match: { type: "code" },
      level: "block",
      content: "none",
      attributes: {
        lang: { type: "string", required: false },
        value: { type: "string" },
      },
    },
  },
  axes: {},
  order: [],
} as const satisfies Contract;
