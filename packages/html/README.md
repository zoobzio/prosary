# @prosary/html

The HTML renderer of prosary. The renderer reads a store and writes HTML. Each
element carries the class of its kind, the classes of its roles, and one
`data-*` attribute per enum attribute. A style binds the roles to CSS, and the
renderer writes the stylesheet. The renderer never writes a `style` attribute.

[`@prosary/core`](../core) has the store. [`@prosary/schema`](../schema) has
the contract. The [`prosary`](../prosary) package exposes this package as the
`prosary/html` subpath.

## Install

```sh
pnpm add @prosary/html
```

## Usage

```ts
import { defineRenderer, defineStyle } from "@prosary/html";

const style = defineStyle(schema, {
  paragraph: { roles: { text: { color: "var(--color-ink)" } } },
  callout: {
    roles: { border: { border: "1px solid var(--color-line)" } },
    variants: {
      kind: { warning: { border: { "border-color": "var(--color-warn)" } } },
    },
  },
});

const renderer = defineRenderer(prosary, style, { callout });

renderer.html("guide"); // <h1 class="p-heading p-heading-text">…
renderer.tree("guide"); // the same as a hast root
renderer.sheet(); // .p-paragraph-text { color: var(--color-ink); } …
```

## Structure

A kind `callout` renders with the class `p-callout`. Each of its roles renders
with a class such as `p-callout-border`. An enum attribute `kind` renders as
`data-kind="warning"`. The prefix is an option of `defineStyle`.

A kind that matches a standard mdast type renders as its semantic element: a
heading as `h1` to `h6`, a paragraph as `p`, a link as `a`, a code block as
`pre` with `code`, a table with `thead` and `tbody`, and so on. A directive
kind without a handler renders as a `div` or a `span`. A kind can have a
handler of its own.

```ts
const callout: Handler<C, "callout"> = (node, part) =>
  element(
    "aside",
    { classes: [part.className, part.role("border")], data: part.data },
    [
      element("span", { classes: [part.role("marker")], data: {} }, [
        text(node.data.attributes.kind),
      ]),
      element("div", { classes: [part.role("text")], data: {} }, part.children),
    ],
  );
```

A handler receives the bound node and a `part`: the rendered children, the
class of the kind, `role(name)` for the class of a role, `classes` for all of
them, and `data` for the variant attributes. The typed attributes are in
`node.data.attributes`. `defineRenderer` throws `UncoveredKindError` when a
kind has no handler of either sort.

## Style

A style binds the roles of each kind. A binding is a map of CSS declarations,
or the name of an existing class. `sheet()` writes one rule per role with
declarations, under the class of the role, and one rule per variant value and
role. A value can be a custom property such as `var(--color-accent)`, so a
theme system that sets the property changes the look without a change to the
HTML.

`defineStyle` checks the style against the contract: each kind, role, variant
attribute, and value must exist, a class name must be a class name, and a
declaration must have a CSS property name and a value with no breakout
sequence. It throws `InvalidStyleError` with every issue.

The page gets the stylesheet as a file or in a `<style>` tag with a nonce. The
markup needs no `unsafe-inline`.

## Outputs

- `html(id)` returns the active document of an id as an HTML string.
- `tree(id)` returns it as a hast root.
- `render(document)` renders a bound document that is not in the source.
- `document(id)` returns the active document from the source.
- `sheet()` returns the stylesheet.

Each output reads the source at call time. After an `apply` or an `update` on
the store, the next call renders the new content.

## Security

The renderer builds hast and serializes it with `hast-util-to-html`, which
escapes text and attribute values. The contract already rejected raw HTML and
unsafe URL schemes when the document was bound. Class names come from the kind
and role names of the contract, or from the style. Attribute values that reach
the markup are the validated attributes of the node.

## Related

- [`@prosary/core`](../core) is the store the renderer reads.
- [`@prosary/schema`](../schema) defines the kinds and the roles.
