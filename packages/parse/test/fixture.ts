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
