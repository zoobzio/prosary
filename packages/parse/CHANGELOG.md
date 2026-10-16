# @prosary/parse

## 0.0.5

## 0.0.4

## 0.0.3

## 0.0.2

### Patch Changes

- [`dcd01cc`](https://github.com/zoobzio/prosary/commit/dcd01cc28178db7216b7614eaecdfcc085cc97d2) Thanks [@zoobzio](https://github.com/zoobzio)! - `directives()` keeps a colon inside a word as text. `remark-directive` reads
  `:name` wherever it stands, so `10:30`, `John 3:16` and `key:value` each lost
  their colon and the word after it to an empty directive. An inline directive
  now begins a word: it follows whitespace, the start of the input or an opener
  (`[`, `*`, `_`, `(`), and its name does not start with a digit. Any other
  match is put back as the text it was written as.

  `mdc()` is a new preset: the component syntax of Nuxt Content, as
  `remark-mdc` reads it, built as the same marked elements `directives()`
  builds. Blocks, nested blocks, inline components and YAML props carry
  `data-directive` and data attributes as before; a `#name` slot builds as a
  `div` carrying `data-slot`; a `[text]{attrs}` span builds as a plain `span`;
  `{attrs}` after a link, image, emphasis or code sets that element's
  attributes; a `{{ expr }}` binding builds as a `binding` component with its
  expression in `data-value`.

## 0.0.1

### Patch Changes

- [`43a9fc8`](https://github.com/zoobzio/prosary/commit/43a9fc8fb0a77e6b182f31afe00814db1095527b) Thanks [@zoobzio](https://github.com/zoobzio)! - The content documents build in a form the config chooses. `content` takes an
  object as well as a directory: `{ dir, output }`, where `output` is `md` for
  the Markdown as written, `mdast` for the Markdown syntax tree as JSON, `hast`
  for the HTML syntax tree as JSON, or `html` for an HTML string. The trees
  carry the frontmatter on their root and no positions. The built file takes
  the extension of its form. The default is `hast`.

- [`33994f9`](https://github.com/zoobzio/prosary/commit/33994f96e2c08a1b7b57a57fd9b37b354c1c7c94) Thanks [@zoobzio](https://github.com/zoobzio)! - `@prosary/parse` is the Markdown pipeline: `definePipeline({ presets })` runs
  remark-parse, the `remark` plugins of each preset, remark-rehype, and the
  `rehype` plugins of each preset, with a stop at the Markdown tree (`parse`)
  and the HTML tree (`build`). With no presets it reads CommonMark and builds
  HTML nodes, nothing more. A preset is `{ remark?, rehype? }`, each a unified
  plugin list.

  The syntax the parser used to hardwire is now four presets exported from
  `@prosary/parse/plugins`: `gfm`, `matter` (frontmatter onto `data.matter` of both
  roots), `headings` (`{#id}` to the element's `id`), and `directives` (each
  directive a `div` or `span` carrying `data-directive="name"` and its
  attributes as data attributes).

  The kit config's `content` takes `presets`, applied in order; a config that
  lists none builds plain CommonMark. The generated module enumerates what the
  content built to: `Element` and `elements` (every tag name), `Directive` and
  `directives` (every directive name), and `content.marker`, the property that
  names a directive on its element.
