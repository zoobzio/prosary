# @prosary/core

The runtime store of prosary. The store holds the bound documents and a patch
over them in a state container that the caller owns, and gives each read the
active content.

[`@prosary/schema`](../schema) has the contract and the bind. The
[`prosary`](../prosary) package re-exports `@prosary/core` and
`@prosary/schema`.

## Install

```sh
pnpm add @prosary/core
```

## The content model

A document is a bound mdast tree. Each node has a stable id. A **layer**
rebinds nodes of the documents by id: a compiled translation is a layer. The
store applies one layer at a time. A **patch** is the same shape without an
identity, for runtime edits.

A read of a document has two steps in this order:

1. The stored document.
2. The patch: an applied layer, merged updates, or both. Each override replaces
   the attributes or the children of one node.

A node the patch does not override shows the stored content. A missing
translation falls back to the source with no error.

## Usage

```ts
import { makeProsary } from "@prosary/core";

const prosary = makeProsary(schema, {
  documents: { guide, intro },
  patch: {},
});

prosary.document("guide"); // the active document
prosary.node("guide", "setup"); // the active node with that id
prosary.resolve("doc:intro#start"); // the node a reference points to

prosary.apply(french); // stores the layer; every read is now French
prosary.update({
  documents: { guide: { setup: { attributes: { depth: 2 } } } },
});
prosary.add(document); // stores a document under its id
prosary.remove("intro");
```

The store has one set of documents and one patch. `apply` stores a layer that
the caller supplies as the patch. The caller decides where the layers come
from: an import, a lazy load, or an API. Switching language is `apply` of
another layer.

## The state container

The store reads and writes the `config` container. The container holds the
`documents` by id and the `patch`. The caller can pass a plain object for tests
and Node. The caller can pass a reactive proxy to track each read and write.

The store replaces each member of the container as a whole. Change the
documents with `add` and `remove`. Change the patch with `apply` and `update`.

## The store

`makeProsary(schema, config, options?)` returns a `Prosary<C>`. The function
checks each stored document against the contract and under its own id, and the
stored patch against the contract and the documents. `options` has `get` and
`set` middleware for each field of the container.

- `config`: the state container.
- `schema`: the schema of the contract.
- `documents()`: returns the document ids.
- `document(id)`: returns the active document. Throws `UnknownDocumentError`.
- `node(id, node)`: returns the active node, or `undefined`.
- `resolve(reference, from?)`: returns the document or the node a reference
  names, or `undefined`. A `#node` reference needs `from`.
- `add(document)`: stores a document under its id. Throws
  `InvalidDocumentError`.
- `remove(id)`: removes a document. Throws `UnknownDocumentError`.
- `update(patch)`: merges a patch into the stored patch at the node level.
  Throws `InvalidPatchError`.
- `apply(layer)`: stores a copy of a layer as the patch. Throws
  `InvalidLayerError`.
- `create(layer)`: checks a layer and returns it.
- `on(event, listener)`: subscribes to an event and returns the function that
  removes the listener.

## Events

The store emits an event after each write lands in the container.

- `document` fires after `add` or `remove`, with the id and the stored
  documents of that id before and after.
- `patch` fires after `update` or `apply`, with the patches before and after
  and the ids of the documents whose overrides changed.
- `change` fires after either, with the same change object.

A write to the container itself does not emit.

## Errors

`InvalidDocumentError`, `InvalidLayerError`, and `InvalidPatchError` extend
`SchemaError` and hold the issues. `UnknownDocumentError` holds the id.

## Related

- [`@prosary/schema`](../schema) binds documents and validates layers.
- [`@prosary/parse`](../parse) turns Markdown into the tree the schema binds.
