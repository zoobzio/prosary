---
"@prosary/vue": patch
---

`@prosary/vue` renders a content document in Vue. `<ProsaryDocument :tree
:components>` renders the HTML tree the kit built as vnodes: each element as
its tag, or as the component named for its tag or its directive. A directive's
component receives the directive's attributes by their written names and the
children in its default slot. `render(tree, components)` is the same as a
function.
