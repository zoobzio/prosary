# Packages

The library, the public `prosary` package, and the build kit. Each package
builds with `obuild` into `.dist`, tests with `vitest` under `test/`, and
publishes under the one fixed version of the repo.

| Package                       | Directory          | Description                                                          |
| ----------------------------- | ------------------ | -------------------------------------------------------------------- |
| [`prosary`](./prosary)        | `packages/prosary` | The public package. It re-exports the runtime and the contract.      |
| [`@prosary/core`](./core)     | `packages/core`    | The runtime. It reads a document against a contract for a renderer.  |
| [`@prosary/kit`](./kit)       | `packages/kit`     | The build kit. It builds a prose package's config into typed output. |
| [`@prosary/schema`](./schema) | `packages/schema`  | The contract types and the runtime validation of a document.         |

No package has an API yet. Each holds an empty entry and the scaffold check
that fails when the first export lands. The framework integrations are in
[`../integrations`](../integrations).
