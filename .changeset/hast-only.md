---
"@prosary/kit": minor
"@prosary/nuxt": minor
---

The generated contract module records the form the content was built in, as
`content.output`.

The Nuxt module serves content built as `hast` only. It refuses a build in
another form, its own or one it adopts, with a message that names the fix.
`useDocument` fetches the document's JSON and resolves the HTML syntax tree
for the active locale, typed as a hast `Root`, which is what the module will
render with component substitution.
