# @prosary/schema

Types and runtime validation for the prosary contract. The contract names the
kinds of node a document may hold. The schema binds an mdast tree to the
contract: it matches each node to a kind, validates the attributes and the
children, computes the node ids, and resolves the local references. The
validation uses the guards of
[`objectively`](https://www.npmjs.com/package/objectively).

The [`prosary`](../prosary) package re-exports `@prosary/schema`.

## Install

```sh
pnpm add @prosary/schema
```

## The contract

A **contract** declares the **kinds**, the **axes**, and the **order**.

- A **kind** claims nodes in the tree. Its **match** names an mdast type, such
  as `blockquote`, or a directive name, such as `callout`. A `where` map
  narrows a type match to nodes whose fields equal the given values.
- A kind has a **level**, `block` or `inline`, and a **content** model: `none`,
  `inline`, `block`, or an explicit list of kinds.
- A kind declares typed **attributes**. The types are `string`, `number`,
  `boolean`, `enum`, `url`, and `token`. An attribute is required unless
  `required` is `false` or it has a `default`. A directive kind reads the
  `attributes` of the node and coerces the string form. A standard kind reads
  the fields of the node.
- A kind names its style **roles**, the named slots that a style binds.
- An **axis** is a dimension of variation, such as `locale`. Each axis has a
  closed set of **contexts** and a default. The **order** is the composition
  order of the axes.

```ts
import { defineContract } from "@prosary/schema";

const schema = defineContract({
  kinds: {
    text: {
      match: { type: "text" },
      level: "inline",
      content: "none",
      attributes: { value: { type: "string" } },
    },
    paragraph: {
      match: { type: "paragraph" },
      level: "block",
      content: "inline",
      roles: ["text"],
    },
    title: {
      match: { type: "heading", where: { depth: 1 } },
      level: "block",
      content: "inline",
      roles: ["text"],
    },
    callout: {
      match: { directive: "callout" },
      level: "block",
      content: "block",
      attributes: {
        kind: { type: "enum", values: ["note", "warning"], default: "note" },
      },
      roles: ["border", "marker", "text"],
    },
  },
  axes: { locale: { contexts: ["en", "fr"], default: "en" } },
  order: ["locale"],
});
```

`defineContract` validates the contract against the `contract` kind. An invalid
contract throws when you call it.

## Bind

`schema.bind(tree, options)` binds a raw mdast tree. It returns a `Result`:
`{ success: true, data }` with the bound `Document`, or
`{ success: false, issues }` with every issue of the tree. The bind does not
change the input. The document id comes from `options.id`, or from `data.id`
on the root.

```ts
const result = schema.bind(tree, { id: "guide" });

if (result.success) {
  const document = result.data;
  document.data.id; // "guide"
  document.data.references; // every doc:… and #… reference the tree makes
  document.children[0].data; // { kind, id, attributes }
}
```

Each bound node keeps its mdast fields and gains three fields in `data`:

- `kind` is the resolved kind.
- `id` is the node id. The id is the explicit `id` in `data` or in a directive
  attribute, then the slug of a heading, then the structural path such as
  `callout[0]/paragraph[1]`.
- `attributes` holds the validated attributes with their defaults.

## Validation kinds

`check`, `assert`, `parse`, and `inspect` each have one function per kind.
`check` returns a boolean and narrows the type. `assert` throws a
`SchemaError` that lists every issue. `parse` asserts and returns the value
with its narrowed type. `inspect` returns a `Result`.

| Kind        | Validates                                                               |
| ----------- | ----------------------------------------------------------------------- |
| `contract`  | A contract definition                                                   |
| `kind`      | A kind name                                                             |
| `axis`      | An axis name                                                            |
| `input`     | One context for each axis, such as `{ locale: "fr" }`                   |
| `reference` | A `doc:<document>#<node>`, `doc:<document>`, or `#<node>` string        |
| `override`  | A replacement for one node: `attributes`, `children`, or both           |
| `patch`     | An overlay: an optional identity, a `context`, and overrides by node id |
| `layer`     | A patch with an `id` and a `name`                                       |
| `node`      | One raw node and its subtree. The bind runs                             |
| `document`  | A full raw tree. The bind runs                                          |

`parse.node` and `parse.document` return the bound tree, not the input.

## Issues

An `Issue` has a `code`, a `message`, a `path` into the tree, and the
`expected` and `received` values. The bind codes are `unknown_node`,
`raw_html`, `invalid_child`, `missing_attribute`, `invalid_attribute`,
`unknown_attribute`, `duplicate_id`, and `unknown_reference`. The rule atoms
add generic codes such as `not_member` and `missing_key`.

Raw HTML is an `html` node. A contract with no kind that matches it rejects it
with `raw_html`. A `url` attribute rejects a scheme outside its `protocols`
list, which defaults to `http`, `https`, and `mailto`.

## Types

- `Contract`, `Definition`, `Match`, `Attribute`, and `AxisDefinition` are the
  shapes of an authored contract.
- `Kind<C>`, `Axis<C>`, `Context<C, A>`, `Default<C, A>`, and `Role<C, K>`
  are names from a contract. `Input<C>` is one context for each axis.
- `Attributes<C, K>` is the bound attribute map of a kind. A required
  attribute is present. An optional attribute can be absent.
- `Node<C, K>` is a bound node. `Document<C>` is a bound root with the document
  id and the references.
- `Override`, `Patch<C>`, and `Layer<C>` are the overlay shapes.
- `Schema<C>` is the bundle that `defineContract` returns. `Check<C>`,
  `Assert<C>`, `Parse<C>`, and `Inspect<C>` are its families of functions.
- `Result<V>` is the outcome of `bind` and `inspect`. `Issue` is a validation
  failure. `Code` is its discriminant. `Rule` is a function that checks a value
  and returns an issue.
- `SchemaError` is the error that `assert` and `parse` throw. It holds the
  `Issue` list.

`slug`, `textOf`, and `parseReference` are exported for the kit and the
renderers.

## Related

- [`@prosary/core`](../core) is the runtime store that reads bound documents.
- [`prosary`](../prosary) re-exports core and schema.
