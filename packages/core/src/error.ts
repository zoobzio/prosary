import type { Issue } from "@prosary/schema";

import { SchemaError } from "@prosary/schema";

/**
 * The error for a document that violates the contract. The document is an
 * argument of {@link makeProsary} or of `add`. The error extends
 * {@link SchemaError} and holds the {@link Issue}s.
 */
export class InvalidDocumentError extends SchemaError {
  constructor(issues: Issue[]) {
    super(issues);
    this.name = "InvalidDocumentError";
  }
}

/**
 * The error for a layer that violates the contract or names content the store
 * does not have. The layer is the argument of `apply` or `create`. The error
 * extends {@link SchemaError} and holds the {@link Issue}s.
 */
export class InvalidLayerError extends SchemaError {
  constructor(issues: Issue[]) {
    super(issues);
    this.name = "InvalidLayerError";
  }
}

/**
 * The error for a patch that violates the contract or names content the store
 * does not have. The patch is the argument of {@link makeProsary} or of
 * `update`. The error extends {@link SchemaError} and holds the
 * {@link Issue}s.
 */
export class InvalidPatchError extends SchemaError {
  constructor(issues: Issue[]) {
    super(issues);
    this.name = "InvalidPatchError";
  }
}

/**
 * The error for an id that names no document of the store. `document`,
 * `node`, and `remove` throw it. The error extends {@link Error}. The `id`
 * property holds the id.
 */
export class UnknownDocumentError extends Error {
  readonly id: string;

  constructor(id: string) {
    super(`no document stored under "${id}"`);
    this.name = "UnknownDocumentError";
    this.id = id;
  }
}

/**
 * Runs `fn`. If `fn` throws a {@link SchemaError}, the function throws a new
 * `Semantic` error with the same {@link Issue}s. The function passes all other
 * errors on. The store uses it to throw {@link InvalidDocumentError},
 * {@link InvalidLayerError}, and {@link InvalidPatchError}.
 */
export const reframe = <T>(
  Semantic: new (issues: Issue[]) => SchemaError,
  fn: () => T,
): T => {
  try {
    return fn();
  } catch (error) {
    if (error instanceof SchemaError) {
      throw new Semantic(error.issues);
    }
    throw error;
  }
};
