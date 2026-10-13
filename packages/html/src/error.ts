import type { Issue } from "@prosary/schema";

import { SchemaError } from "@prosary/schema";

/**
 * The error for a style that names a kind, a role, an attribute, or a value
 * outside the contract, or a declaration that could break out of a rule. The
 * error extends {@link SchemaError} and holds the {@link Issue}s.
 */
export class InvalidStyleError extends SchemaError {
  constructor(issues: Issue[]) {
    super(issues);
    this.name = "InvalidStyleError";
  }
}

/**
 * The error for a contract kind that has no handler. `defineRenderer` throws
 * it. The `kinds` property holds the names.
 */
export class UncoveredKindError extends Error {
  readonly kinds: string[];

  constructor(kinds: string[]) {
    super(`no handler for kind: ${kinds.join(", ")}`);
    this.name = "UncoveredKindError";
    this.kinds = kinds;
  }
}
