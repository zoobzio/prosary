---
"@prosary/kit": minor
"@prosary/parse": minor
---

The content documents build in a form the config chooses. `content` takes an
object as well as a directory: `{ dir, output }`, where `output` is `md` for
the Markdown as written, `mdast` for the Markdown syntax tree as JSON, `hast`
for the HTML syntax tree as JSON, or `html` for an HTML string. The trees
carry the frontmatter on their root and no positions. The built file takes
the extension of its form. The default is `hast`.
