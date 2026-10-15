# Packages

| Package                             | Directory            | Description                                                 |
| ----------------------------------- | -------------------- | ----------------------------------------------------------- |
| [`prosary`](./prosary)              | `packages/prosary`   | Umbrella package for the runtime                            |
| [`@prosary/catalog`](./catalog)     | `packages/catalog`   | Catalogs: bundles and documents, served and consumed        |
| [`@prosary/core`](./core)           | `packages/core`      | The runtime service: deliver, resolve and format messages   |
| [`@prosary/kit`](./kit)             | `packages/kit`       | Build kit: enumerated content → per-locale JSON and modules |
| [`@prosary/parse`](./parse)         | `packages/parse`     | The Markdown pipeline: CommonMark to an HTML tree           |
| [`@prosary/schema`](./schema)       | `packages/schema`    | Message contract types and runtime validation               |
| [`@prosary/translate`](./translate) | `packages/translate` | LLM translation behind `prosary translate`                  |

The kit is a build-time tool and is not re-exported by `prosary`. Framework
integrations live in [`../integrations`](../integrations).
