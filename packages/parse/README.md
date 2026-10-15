# @prosary/parse

The Markdown pipeline of prosary: CommonMark to a Markdown tree (mdast) to an
HTML tree (hast). On its own it does nothing more than that. Presets extend
it: a preset is a pair of plugin lists, one for each side.

The package carries the remark and rehype dependencies.
[`@prosary/kit`](../kit) uses it at build time to turn the content documents
into trees. A runtime that receives a tree does not import it.

## Install

```sh
pnpm add @prosary/parse
```

## Usage

```ts
import { definePipeline } from "@prosary/parse";
import { matter } from "@prosary/parse/plugins";

const pipeline = definePipeline({ presets: [matter()] });

pipeline.parse(source); // the Markdown tree
pipeline.build(source); // the HTML tree
```

The trees keep the position of each node, so the kit can report an issue
with a line and a column. A plugin that fails the file throws its message.

## Presets

```ts
interface Preset {
  remark?: PluggableList;
  rehype?: PluggableList;
}
```

The `remark` plugins run on the Markdown tree after it is parsed, in the order
listed; the `rehype` plugins run on the HTML tree after the bridge. Presets
apply in the order given. Each list is what unified's `use` takes.

`@prosary/parse/plugins` carries four:

### `gfm(options?)`

GitHub Flavored Markdown. Tables, task lists, strikethrough, footnotes, and
autolinks parse as their nodes and build as their elements, through
[`remark-gfm`](https://github.com/remarkjs/remark-gfm). Takes its options.

### `matter()`

YAML frontmatter. A leading `---` block parses as YAML and moves from the
tree to `data.matter` on the root, of the Markdown tree and the HTML tree
alike. A block that is not a map, or that does not parse, fails the file with
the position of the block. `Matter` is the parsed frontmatter's type; the
preset declares it as `matter` on the root data of both trees.

### `headings()`

Explicit heading ids. A trailing `{#id}` on a heading leaves the text and
becomes the `id` of the heading element, so `## Install {#install}` builds as
`<h2 id="install">Install</h2>`. The id starts with a letter and holds
letters, digits, `-`, and `_`. A heading with no marker is not changed.

### `directives()`

The directive syntax of
[`remark-directive`](https://github.com/remarkjs/remark-directive), built as
marked elements.

- `:::name{attrs}` … `:::` is a container and builds as a `div`
- `::name{attrs}` is a leaf and builds as an empty `div`
- `:name[text]{attrs}` is inline and builds as a `span`

Each element carries `data-directive="name"`. An `id` or `class` attribute is
the element's; any other attribute is a `data-` attribute. A bare attribute
such as `{draft}` has the value `""`.

```md
:::callout{kind="warning"}
Careful.
:::
```

```html
<div data-directive="callout" data-kind="warning"><p>Careful.</p></div>
```

## Types

- `Pipeline` is what `definePipeline` returns.
- `Preset` and `PipelineOptions` are what it takes.
- `Mdast` and `Hast` are the two roots.

## Related

- [`@prosary/kit`](../kit) builds the content documents through the pipeline.
