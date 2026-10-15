---
"@prosary/parse": patch
"@prosary/kit": patch
"@prosary/nuxt": patch
---

`@prosary/parse` is the Markdown pipeline: `definePipeline({ presets })` runs
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
