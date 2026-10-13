import type {
  Contract,
  Document,
  Issue,
  Layer,
  Node,
  Overlay,
  Patch,
  Schema,
  Target,
} from "@prosary/schema";
import type {
  Config,
  DocumentChange,
  Event,
  Events,
  Listener,
  Options,
  PatchChange,
  Prosary,
} from "./types";

import { copy, equals, keys } from "objectively";
import { SchemaError, index, parseReference, replace } from "@prosary/schema";

import {
  InvalidDocumentError,
  InvalidLayerError,
  InvalidPatchError,
  UnknownDocumentError,
  reframe,
} from "./error";

/**
 * Makes a {@link Prosary} store over a schema and a state container. The
 * schema is the contract. The container holds the base documents and the
 * patch. The store reads and writes the container through the `options`
 * middleware.
 *
 * A read gives the base document with the overrides of the patch applied.
 *
 * @param schema - The schema of the contract, from `defineContract`.
 * @param config - The state container.
 * @param options - The middleware for reads and writes of `config`.
 * @returns The store.
 * @throws InvalidDocumentError when a stored document violates the contract
 *   or is stored under an id other than its own.
 * @throws InvalidPatchError when the stored patch violates the contract or
 *   names a document or a node the store does not have.
 */
export const makeProsary = <C extends Contract>(
  schema: Schema<C>,
  config: Config<C>,
  options: Options<C> = {},
): Prosary<C> => {
  /**
   * The listeners of each event, in subscription order.
   */
  const listeners: { [E in Event<C>]: Set<Listener<C, E>> } = {
    document: new Set(),
    patch: new Set(),
    change: new Set(),
  };

  /**
   * Calls the listeners of an event with the arguments. The function iterates
   * over a copy, so a listener can unsubscribe itself or another listener
   * during the call.
   */
  const emit = <E extends Event<C>>(event: E, ...args: Events<C>[E]): void => {
    for (const listener of [...listeners[event]]) {
      listener(...args);
    }
  };

  /**
   * Subscribes a listener to an event and returns the function that removes
   * it.
   */
  const on = <E extends Event<C>>(
    event: E,
    listener: Listener<C, E>,
  ): (() => void) => {
    listeners[event].add(listener);
    return () => {
      listeners[event].delete(listener);
    };
  };

  /**
   * Whether an event or `change` has a listener. The setters skip the work of
   * a change object when nothing listens.
   */
  const heard = (event: "document" | "patch"): boolean =>
    listeners[event].size > 0 || listeners.change.size > 0;

  /**
   * Returns the ids of the documents whose overrides differ between two
   * patches.
   */
  const touched = (before: Patch, after: Patch): string[] => {
    const ids = new Set([
      ...keys(before.documents ?? {}),
      ...keys(after.documents ?? {}),
    ]);
    return [...ids].filter(
      (id) => !equals(before.documents?.[id], after.documents?.[id]),
    );
  };

  /**
   * The id that `add` or `remove` wrote, for the change object of the
   * `documents` setter. The setter cannot tell which id changed from the
   * records alone when a write replaces a document in place, so the writers
   * set it before they assign.
   */
  let writing: string | undefined;

  /**
   * The active state. A read gets the value from the container and passes it
   * to the matching `options.get` middleware. A write passes the value to the
   * matching `options.set` middleware, stores the result in the container, and
   * then emits the event of the field and `change` with one change object.
   */
  const proxy: Config<C> = {
    get documents() {
      const through = options.get?.config?.documents;
      if (through) {
        return through(config.documents);
      }
      return config.documents;
    },
    set documents(value) {
      const through = options.set?.config?.documents;
      const listening = heard("document");
      const before = config.documents;
      const id = writing;
      config.documents = through ? through(value) : value;
      if (!listening || id === undefined) {
        return;
      }
      const change: DocumentChange<C> = {
        field: "documents",
        id,
        before: before[id],
        after: config.documents[id],
      };
      emit("document", change);
      emit("change", change);
    },
    get patch() {
      const through = options.get?.config?.patch;
      if (through) {
        return through(config.patch);
      }
      return config.patch;
    },
    set patch(value) {
      const through = options.set?.config?.patch;
      const listening = heard("patch");
      const before = config.patch;
      config.patch = through ? through(value) : value;
      if (!listening) {
        return;
      }
      const change: PatchChange = {
        field: "patch",
        before,
        after: config.patch,
        documents: touched(before, config.patch),
      };
      emit("patch", change);
      emit("change", change);
    },
  };

  /**
   * Checks a document against the contract and checks that it has an id.
   * Throws {@link InvalidDocumentError} on a failure.
   */
  const checkDocument = (document: unknown, id?: string): void => {
    reframe(InvalidDocumentError, () => schema.assert.document(document));
    const issues: Issue[] = [];
    const own = schema.check.document(document) ? document.data.id : "";
    if (own === "") {
      issues.push({
        code: "empty",
        message: "Document must have an id.",
        path: ["data", "id"],
        received: own,
      });
    } else if (id !== undefined && id !== own) {
      issues.push({
        code: "type_mismatch",
        message: `Document '${own}' is stored under '${id}'.`,
        path: ["data", "id"],
        expected: id,
        received: own,
      });
    }
    if (issues.length > 0) {
      throw new InvalidDocumentError(issues);
    }
  };

  /**
   * Checks an overlay against the stored documents. Each document id must name
   * a stored document. Each override must apply to its node. Throws a
   * `Semantic` error that holds every issue.
   */
  const checkOverlay = (
    Semantic: new (issues: Issue[]) => SchemaError,
    overlay: Overlay | undefined,
  ): void => {
    const issues: Issue[] = [];
    const documents = proxy.documents;
    for (const [id, overrides] of Object.entries(overlay ?? {})) {
      const document = documents[id];
      if (document === undefined) {
        issues.push({
          code: "unknown_reference",
          message: `Document id '${id}' names no stored document.`,
          path: ["documents", id],
          received: id,
        });
        continue;
      }
      const checked = schema.meta.bind.overrides(document, overrides);
      if (!checked.success) {
        issues.push(
          ...checked.issues.map((issue) => ({
            ...issue,
            path: ["documents", id, ...(issue.path ?? [])],
          })),
        );
      }
    }
    if (issues.length > 0) {
      throw new Semantic(issues);
    }
  };

  // Checks the stored documents and the stored patch.
  for (const [id, document] of Object.entries(proxy.documents)) {
    checkDocument(document, id);
  }
  reframe(InvalidPatchError, () => schema.assert.patch(proxy.patch));
  checkOverlay(InvalidPatchError, proxy.patch.documents);

  /**
   * Returns the ids of the documents.
   */
  const documents = (): string[] => keys(proxy.documents);

  /**
   * Returns the stored document of an id. Throws {@link UnknownDocumentError}
   * when no document has the id.
   */
  const stored = (id: string): Document<C> => {
    const document = proxy.documents[id];
    if (document === undefined) {
      throw new UnknownDocumentError(id);
    }
    return document;
  };

  /**
   * Returns the active document of an id: the stored document with each
   * override of the patch applied to its node. The overrides passed the
   * checks when they were stored, so a failure here is a defect, and the
   * function throws the schema error.
   */
  const document = (id: string): Document<C> => {
    const base = stored(id);
    const overrides = proxy.patch.documents?.[id] ?? {};
    let active = base;
    for (const [node, override] of Object.entries(overrides)) {
      active = replace<C, Document<C>>(active, node, (target) => {
        const applied = schema.meta.bind.override(target, override);
        if (!applied.success) {
          throw new SchemaError(applied.issues);
        }
        return applied.data;
      });
    }
    return active;
  };

  /**
   * Returns the active node of an id in a document.
   */
  const node = (id: string, target: string): Node<C> | undefined =>
    index(document(id)).get(target);

  /**
   * Resolves a reference to a document or a node.
   */
  const resolve = (
    reference: string | Target,
    from?: string,
  ): Document<C> | Node<C> | undefined => {
    const target =
      typeof reference === "string" ? parseReference(reference) : reference;
    const id = target?.document ?? from;
    if (target === undefined || id === undefined || !(id in proxy.documents)) {
      return undefined;
    }
    return target.node === undefined ? document(id) : node(id, target.node);
  };

  /**
   * Stores a document under its id. Throws {@link InvalidDocumentError} when
   * the document is invalid.
   */
  const add = (candidate: Document<C>): void => {
    checkDocument(candidate);
    writing = candidate.data.id;
    proxy.documents = { ...proxy.documents, [candidate.data.id]: candidate };
    writing = undefined;
  };

  /**
   * Removes the document of an id. Throws {@link UnknownDocumentError} when no
   * document has the id.
   */
  const remove = (id: string): void => {
    stored(id);
    const rest = { ...proxy.documents };
    delete rest[id];
    writing = id;
    proxy.documents = rest;
    writing = undefined;
  };

  /**
   * Merges a patch into the stored patch. An override replaces the stored
   * override of the same node. An identity of the patch replaces the stored
   * one. Throws {@link InvalidPatchError} when the patch is invalid.
   */
  const update = (patch: Patch): void => {
    reframe(InvalidPatchError, () => schema.assert.patch(patch));
    checkOverlay(InvalidPatchError, patch.documents);
    const current = proxy.patch;
    const merged: Overlay = { ...current.documents };
    for (const [id, overrides] of Object.entries(patch.documents ?? {})) {
      merged[id] = { ...merged[id], ...overrides };
    }
    proxy.patch = { ...current, ...patch, documents: merged };
  };

  /**
   * Checks a layer against the contract and the documents. Throws
   * {@link InvalidLayerError} when the layer is invalid.
   */
  const create = (layer: Layer): Layer => {
    reframe(InvalidLayerError, () => schema.assert.layer(layer));
    checkOverlay(InvalidLayerError, layer.documents);
    return layer;
  };

  /**
   * Stores a copy of a layer as the patch. Throws {@link InvalidLayerError}
   * when the layer is invalid.
   */
  const apply = (layer: Layer): void => {
    proxy.patch = copy(create(layer));
  };

  return {
    config: proxy,
    schema,
    documents,
    document,
    node,
    resolve,
    add,
    remove,
    update,
    apply,
    create,
    on,
  };
};
