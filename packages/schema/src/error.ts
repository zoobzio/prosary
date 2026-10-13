import type { Issue } from "./types";

const summarize = (issues: Issue[]): string =>
  issues
    .map((issue) =>
      issue.path?.length
        ? `${issue.path.join(".")}: ${issue.message}`
        : issue.message,
    )
    .join("\n");

/**
 * The error that an assertion or a parse throws when it rejects a value. The
 * `issues` property holds the {@link Issue}s. Each issue has a code, a message,
 * and a path. The error message has one line for each issue, with the path as
 * a prefix.
 */
export class SchemaError extends Error {
  readonly issues: Issue[];

  constructor(issues: Issue[]) {
    super(summarize(issues));
    this.name = "SchemaError";
    this.issues = issues;
  }
}
