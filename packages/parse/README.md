# @prosary/parse

The parse step of prosary. The parser turns Markdown into an mdast tree. It
reads CommonMark with the GFM extensions, the directive syntax of
[`remark-directive`](https://github.com/remarkjs/remark-directive), and YAML
frontmatter. The parser does not validate. Pass the tree to the `bind` of a
[`@prosary/schema`](../schema) contract.

The package carries the remark dependency. A client that receives an mdast tree
from a server does not import it. The [`prosary`](../prosary) package exposes
it as the `prosary/parse` subpath.

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
  on the root. A string `id` in the block also sets `data.id`, which the bind
  takes as the document id. A block that is not a map, or that does not parse,
  throws a `ParseError` with the position of the block.
- **Directives.** `:::name{attrs}` is a container, `::name{attrs}` is a leaf,
  and `:name[text]{attrs}` is inline. Each becomes a directive node with a
  `name` and an `attributes` map of strings. A bare attribute such as `{draft}`
  has the value `""`. The bind coerces the strings by the attribute types of
  the contract.
- **Heading ids.** A trailing `{#id}` on a heading moves to `data.id` on the
  heading, and the marker leaves the text. The bind takes it as the explicit
  node id.
- **GFM.** Tables, task lists, strikethrough, footnotes, and autolinks parse as
  their mdast nodes.

Raw HTML parses as an `html` node. The reference contract has no kind for it,
so the bind rejects it.

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

- [`@prosary/schema`](../schema) binds the tree to a contract.
