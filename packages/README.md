# Packages

The library, the public `prosary` package, and the build kit. Each package
builds with `obuild` into `.dist`, tests with `vitest` under `test/`, and
publishes under the one fixed version of the repo.

| Package                       | Directory          | Description                                                             |
| ----------------------------- | ------------------ | ----------------------------------------------------------------------- |
| [`prosary`](./prosary)        | `packages/prosary` | The public package. It re-exports the runtime and the contract.         |
| [`@prosary/core`](./core)     | `packages/core`    | The runtime. It reads a document against a contract for a renderer.     |
| [`@prosary/html`](./html)     | `packages/html`    | The HTML renderer. It writes hast, HTML, and a stylesheet from a style. |
| [`@prosary/kit`](./kit)       | `packages/kit`     | The build kit. It builds a prose package's config into typed output.    |
| [`@prosary/parse`](./parse)   | `packages/parse`   | The parse step. It turns Markdown into an mdast tree for the bind.      |
| [`@prosary/schema`](./schema) | `packages/schema`  | The contract types and the runtime validation of a document.            |

The schema, the parser, the store, and the HTML renderer have an API. The kit
holds an empty entry and the scaffold check that fails when the first export
lands. The
framework integrations are in [`../integrations`](../integrations).
