import type { Issue } from "@prosary/schema";

import { SchemaError } from "@prosary/schema";

/**
 * Raised when a source answers a listing with something that is not the
 * list expected — a broken source, never a state a caller can reach through
 * its own input. Carries the offending `value`.
 */
export class MalformedListingError extends Error {
  readonly value: unknown;

  constructor(value: unknown, expected: string) {
    super(
      `source answered the listing with something that is not a list of ${expected}`,
    );
    this.name = "MalformedListingError";
    this.value = value;
  }
}

/**
 * Raised when a source answers a retrieval with a payload that fails the
 * contract — corruption, deliberately distinct from the miss that resolves
 * `undefined`, so a broken payload can never pass as an absent one. Extends
 * {@link SchemaError} with the contract's {@link Issue}s, and carries the
 * `locale` the payload was retrieved under.
 */
export class MalformedBundleError extends SchemaError {
  readonly locale: string;

  constructor(locale: string, issues: Issue[]) {
    super(issues);
    this.name = "MalformedBundleError";
    this.locale = locale;
  }
}

/**
 * Raised when a source answers a document retrieval with a payload that is
 * not an HTML tree. Carries the `locale` and `path` it was retrieved under,
 * and the offending `value`.
 */
export class MalformedDocumentError extends Error {
  readonly locale: string;

  readonly path: string;

  readonly value: unknown;

  constructor(locale: string, path: string, value: unknown) {
    super(
      `source answered ${JSON.stringify(path)} in ${locale} with something that is not an HTML tree`,
    );
    this.name = "MalformedDocumentError";
    this.locale = locale;
    this.path = path;
    this.value = value;
  }
}

/**
 * Raised when the wire answers with a failure status. Carries the `url`
 * and `status` of the failed request. A 404 answering a retrieval is a
 * miss, not this error; a 404 answering the listing is this error — a
 * catalog with no listing route is misconfigured, not empty.
 */
export class FailedRequestError extends Error {
  readonly url: string;

  readonly status: number;

  constructor(url: string, status: number) {
    super(`request to "${url}" failed with status ${status}`);
    this.name = "FailedRequestError";
    this.url = url;
    this.status = status;
  }
}
