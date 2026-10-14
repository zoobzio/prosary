# @prosary/parse

The parse step of prosary. The parser turns Markdown into an mdast tree. It
reads CommonMark with the GFM extensions, the directive syntax of
[`remark-directive`](https://github.com/remarkjs/remark-directive), and YAML
frontmatter. The parser does not validate.

The package carries the remark dependency. [`@prosary/kit`](../kit) uses it at
build time to turn the content documents into trees. A runtime that receives
a tree does not import it.

## Install

```sh
pnpm add @prosary/parse
```

## Usage

```ts
import { defineParser } from "@prosary/parse";

const { parse } = defineParser();
const tree = parse(source);

tree.data?.matter; // the frontmatter, as a map
tree.data?.id; // the frontmatter `id`, when it is a string
```

The parser keeps the position of each node, so the kit can report an issue
with a line and a column.

## Syntax

- **Frontmatter.** A leading YAML block moves from the tree to `data.matter`
  on the root. A string `id` in the block also sets `data.id`. A block that
  is not a map, or that does not parse, throws a `ParseError` with the
  position of the block.
- **Directives.** `:::name{attrs}` is a container, `::name{attrs}` is a leaf,
  and `:name[text]{attrs}` is inline. Each becomes a directive node with a
  `name` and an `attributes` map of strings. A bare attribute such as `{draft}`
  has the value `""`.
- **Heading ids.** A trailing `{#id}` on a heading moves to `data.id` on the
  heading, and the marker leaves the text.
- **GFM.** Tables, task lists, strikethrough, footnotes, and autolinks parse as
  their mdast nodes.

Raw HTML parses as an `html` node.

## Plugins

`remarkMatter` and `remarkHeadingId` are exported as unified plugins for a
processor of your own.

## Types

- `Parser` is the bundle that `defineParser` returns.
- `Matter` is the parsed frontmatter.
- `Root` is the mdast root, re-exported with the `matter` and `id` data fields
  that the plugins add.
- `ParseError` is the error that `parse` throws.

## Related

- [`@prosary/kit`](../kit) builds the content documents through the parser.
