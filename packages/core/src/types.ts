import type {
  Contract,
  Document,
  Layer,
  Node,
  Patch,
  Schema,
  Target,
} from "@prosary/schema";

/**
 * The state that a {@link Prosary} store reads and writes. The state has the
 * base documents by document id and the patch over them. The patch can be a
 * layer that `apply` stored or the overrides that `update` merged. An empty
 * patch is the base. The container can be a plain object or a reactive proxy.
 * The store replaces each member as a whole.
 */
export type Config<C extends Contract> = {
  documents: Record<string, Document<C>>;
  patch: Patch;
};

/**
 * The middleware for reads and writes of the state container. Each slot
 * receives the value of the matching `config` field and returns the value that
 * the store uses. A missing slot passes the value on.
 */
export type Options<C extends Contract> = {
  get?: {
    config?: {
      documents?: (
        documents: Record<string, Document<C>>,
      ) => Record<string, Document<C>>;
      patch?: (patch: Patch) => Patch;
    };
  };
  set?: {
    config?: {
      documents?: (
        documents: Record<string, Document<C>>,
      ) => Record<string, Document<C>>;
      patch?: (patch: Patch) => Patch;
    };
  };
};

/**
 * A change of the documents. `id` is the document that `add` or `remove`
 * wrote. `before` and `after` are the stored documents of that id around the
 * write. One of them is `undefined` for an add of a new id or a remove.
 */
export type DocumentChange<C extends Contract> = {
  field: "documents";
  id: string;
  before: Document<C> | undefined;
  after: Document<C> | undefined;
};

/**
 * A change of the patch. `before` and `after` are the stored patches around
 * the write. `documents` lists the ids of the documents whose overrides
 * differ between them, for a cache to invalidate.
 */
export type PatchChange = {
  field: "patch";
  before: Patch;
  after: Patch;
  documents: string[];
};

/**
 * A change of the state. `field` tells which member of the container the
 * write replaced.
 */
export type Change<C extends Contract> = DocumentChange<C> | PatchChange;

/**
 * The events of a {@link Prosary} store, keyed by name. Each value is the
 * argument list of a listener. The store emits each event after the write
 * lands in the container, so a listener reads the new state.
 *
 * - `document`: a document changed with `add` or `remove`. The listener
 *   receives the {@link DocumentChange}.
 * - `patch`: the patch changed with `update` or `apply`. The listener receives
 *   the {@link PatchChange}.
 * - `change`: a document or the patch changed. The listener receives the same
 *   {@link Change} object as the event of the field. The store emits `change`
 *   after `document` or `patch`.
 */
export type Events<C extends Contract> = {
  document: [change: DocumentChange<C>];
  patch: [change: PatchChange];
  change: [change: Change<C>];
};

/**
 * The name of an event of a {@link Prosary} store.
 */
export type Event<C extends Contract> = keyof Events<C>;

/**
 * A listener for one event of a {@link Prosary} store.
 */
export type Listener<C extends Contract, E extends Event<C>> = (
  ...args: Events<C>[E]
) => void;

/**
 * The reads of a store. A renderer takes a `Source`. Each read gives the
 * active content: the base document with the patch applied.
 */
export interface Source<C extends Contract> {
  /**
   * Returns the ids of the documents.
   */
  documents: () => string[];

  /**
   * Returns the active document of an id: the base document with the
   * overrides of the patch applied. Each call returns a new object when the
   * patch overrides a node of the document. Throws `UnknownDocumentError`
   * when no document has the id.
   */
  document: (id: string) => Document<C>;

  /**
   * Returns the active node of an id in a document. Returns `undefined` when
   * the document has no node with the id. Throws `UnknownDocumentError` when
   * no document has the document id.
   */
  node: (id: string, node: string) => Node<C> | undefined;

  /**
   * Resolves a reference. A `doc:guide#setup` reference gives the node. A
   * `doc:guide` reference gives the document. A `#setup` reference gives the
   * node in the document `from`. Returns `undefined` for a string that is not
   * a reference, for a reference that names no document or no node, and for a
   * `#setup` reference with no `from`.
   */
  resolve: (
    reference: string | Target,
    from?: string,
  ) => Document<C> | Node<C> | undefined;
}

/**
 * The runtime store for a contract. A read gives the active content. `add`,
 * `remove`, `update`, and `apply` change the state in `config`. Each write
 * emits an event. `on` subscribes to one.
 */
export interface Prosary<C extends Contract> extends Source<C> {
  /**
   * The state container of the store.
   */
  config: Config<C>;

  /**
   * The validation functions for the contract.
   */
  schema: Schema<C>;

  /**
   * Stores a document under its id. A document with the id of a stored
   * document replaces it. Throws `InvalidDocumentError` when the document
   * violates the contract or has no id.
   */
  add: (document: Document<C>) => void;

  /**
   * Removes the document of an id. The patch keeps its overrides for the id.
   * Throws `UnknownDocumentError` when no document has the id.
   */
  remove: (id: string) => void;

  /**
   * Merges a patch into the stored patch. An override replaces the stored
   * override of the same node. An identity of the patch replaces the stored
   * one. Throws `InvalidPatchError` when the patch violates the contract or
   * names a document or a node the store does not have.
   */
  update: (patch: Patch) => void;

  /**
   * Stores a copy of a layer as the patch. The active content becomes the
   * base with the layer applied. Throws `InvalidLayerError` when the layer
   * violates the contract or names a document or a node the store does not
   * have.
   */
  apply: (layer: Layer) => void;

  /**
   * Checks a layer against the contract and the documents and returns the
   * layer. The active content stays the same. Throws `InvalidLayerError` when
   * the layer is invalid.
   */
  create: (layer: Layer) => Layer;

  /**
   * Subscribes a listener to an event. The store calls the listeners of an
   * event in subscription order, after the write lands in the container. A
   * write through `add`, `remove`, `update`, or `apply` emits. A write to the
   * container itself does not. An error in a listener propagates to the caller
   * of the write. Returns a function that removes the listener.
   */
  on: <E extends Event<C>>(event: E, listener: Listener<C, E>) => () => void;
}
