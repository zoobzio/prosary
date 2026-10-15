---
"@prosary/parse": patch
---

`directives()` keeps a colon inside a word as text. `remark-directive` reads
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
