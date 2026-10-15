# @prosary/catalog

Catalogs: sources of locale bundles and content documents for a prosary app,
each in two angles. A **catalog** fronts storage callbacks — the serving
angle, for wherever the bundles and documents actually live. A **client**
fronts a remote endpoint speaking the wire protocol — the consuming angle.
Both produce the same shape, so they chain: a provider's callbacks can
delegate to a client.

A catalog is a pure resolver. It holds no state and proves every answer
before it surfaces, so a source hands back storage reads as-is.

## Install

```sh
pnpm add @prosary/catalog
```

## Messages

```ts
import {
  defineMessageCatalog,
  defineMessageClient,
  toEntries,
} from "@prosary/catalog";

// Serving: bundles from a store, the listing from the contract.
const served = defineMessageCatalog(schema, {
  list: () => toEntries(contract),
  get: (locale) => store.get(`messages/${locale}`),
});

// Consuming: the same catalog behind a service.
const remote = defineMessageClient(schema, {
  base: "https://lang.example/api",
  headers: { authorization: `Bearer ${token}` },
});

await remote.list(); // [{ id: "fr", name: "français" }, …]
await remote.get("fr"); // the bundle, proven against the contract
```

`list` answers the locales the source serves with their display names.
`get` answers one locale's bundle, or `undefined` on a miss. A locale outside
the contract throws before the source is asked; a payload that fails the
contract throws `MalformedBundleError`.

## Content

```ts
import { defineContentCatalog, defineContentClient } from "@prosary/catalog";

const served = defineContentCatalog(schema, {
  list: () => documents,
  get: (locale, path) => store.get(`content/${locale}/${path}`),
});

const remote = defineContentClient(schema, { base: "https://cms.example/api" });

await remote.list(); // ["guide/intro.md", "faq.md"]
await remote.get("fr", "guide/intro.md"); // the HTML tree, as the kit builds it
```

`list` answers the documents the source serves, as their paths. `get` answers
one document's HTML tree in one locale, or `undefined` on a miss. A payload
that is not a tree throws `MalformedDocumentError`.

## Wire protocol

A client extends its `base` with fixed routes, each answering JSON:

| Route                            | Answers                  |
| -------------------------------- | ------------------------ |
| `{base}/messages`                | the locale entries       |
| `{base}/messages/{locale}`       | one locale's bundle      |
| `{base}/content`                 | the document paths       |
| `{base}/content/{locale}/{path}` | one document's HTML tree |

A 404 on a retrieval is a miss. Any failure status on a listing, and any
other failure status on a retrieval, throws `FailedRequestError`.

## Types

- `MessageCatalog`, `MessageProvider`, `Entry`
- `ContentCatalog`, `ContentProvider`
- `Client` — the transport config both clients take
