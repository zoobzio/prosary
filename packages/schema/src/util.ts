import type { Issue, Rule } from "./types";

import { equals, object, wrapped } from "objectively";

/**
 * Checks that a value is a `{name}` token reference.
 */
export const isToken = wrapped("{", "}");

/**
 * Rule builders. Each builder takes a name and parameters and returns a
 * {@link Rule}. Each predicate atom returns one failure code. Each combinator
 * runs other rules and adds `path` to the issues from them.
 */

/**
 * Adds the key to the start of the path of an issue.
 */
export const nest = (key: string, issue: Issue): Issue => ({
  ...issue,
  path: [key, ...(issue.path ?? [])],
});

/* ── predicate atoms ─────────────────────────────────────────────────── */

/**
 * Rejects a value that is not a string.
 */
export const text =
  (name: string): Rule =>
  (v) => {
    if (typeof v !== "string") {
      return {
        code: "not_string",
        message: `${name} must be a string.`,
        received: v,
      };
    }
  };

/**
 * Rejects a string that is empty after trim.
 */
export const filled =
  (name: string): Rule =>
  (v) => {
    if (typeof v === "string" && v.trim() === "") {
      return {
        code: "empty",
        message: `${name} must not be empty.`,
        received: v,
      };
    }
  };

/**
 * Rejects a value that is not a member of the set.
 */
export const member =
  (name: string, set: Set<string>): Rule =>
  (v) => {
    if (typeof v !== "string" || !set.has(v)) {
      return {
        code: "not_member",
        message: `${name} must be a member of the known set.`,
        expected: [...set],
        received: v,
      };
    }
  };

/**
 * Rejects a value that is not a finite number.
 */
export const numeric =
  (name: string): Rule =>
  (v) => {
    if (typeof v !== "number" || !Number.isFinite(v)) {
      return {
        code: "not_number",
        message: `${name} must be a finite number.`,
        received: v,
      };
    }
  };

/**
 * Rejects a number that is not an integer.
 */
export const integer =
  (name: string): Rule =>
  (v) => {
    if (typeof v === "number" && !Number.isInteger(v)) {
      return {
        code: "not_integer",
        message: `${name} must be an integer.`,
        received: v,
      };
    }
  };

/**
 * Rejects a number that is outside the range. The range includes `min` and
 * `max`. An open bound is `undefined`.
 */
export const range =
  (name: string, min?: number, max?: number): Rule =>
  (v) => {
    if (typeof v !== "number") {
      return;
    }
    if ((min !== undefined && v < min) || (max !== undefined && v > max)) {
      return {
        code: "out_of_range",
        message: `${name} must be between ${min ?? "-∞"} and ${max ?? "∞"}.`,
        expected: [min, max],
        received: v,
      };
    }
  };

/**
 * Rejects a value that is not a boolean.
 */
export const flag =
  (name: string): Rule =>
  (v) => {
    if (typeof v !== "boolean") {
      return {
        code: "not_boolean",
        message: `${name} must be a boolean.`,
        received: v,
      };
    }
  };

/**
 * Rejects a value that is not a `{name}` reference with a non-empty name.
 */
export const token =
  (name: string): Rule =>
  (v) => {
    if (!isToken(v) || v.length < 3) {
      return {
        code: "not_reference",
        message: `${name} must reference a token as {name}.`,
        received: v,
      };
    }
  };

/**
 * Returns the scheme of a URL in lower case. Returns `undefined` for a URL with
 * no scheme.
 */
export const scheme = (v: string): string | undefined => {
  const found = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(v);
  return found?.[1]?.toLowerCase();
};

/**
 * Rejects a string whose scheme is not in the set. A string with no scheme
 * passes.
 */
export const url =
  (name: string, protocols: Set<string>): Rule =>
  (v) => {
    if (typeof v !== "string") {
      return;
    }
    const found = scheme(v);
    if (found !== undefined && !protocols.has(found)) {
      return {
        code: "not_url",
        message: `${name} must use a permitted protocol.`,
        expected: [...protocols],
        received: v,
      };
    }
  };

/**
 * Rejects a value that is not a plain object.
 */
export const container =
  (name: string): Rule =>
  (v) => {
    if (!object(v)) {
      return {
        code: "not_object",
        message: `${name} must be an object.`,
        received: v,
      };
    }
  };

/* ── combinator atoms ────────────────────────────────────────────────── */

/**
 * Runs the rules in order and returns the first issue.
 */
export const all =
  (rules: Rule[]): Rule =>
  (v) => {
    for (const rule of rules) {
      const issue = rule(v);
      if (issue) {
        return issue;
      }
    }
  };

/**
 * Accepts a value when every rule of at least one branch passes. The rule
 * rejects a value that matches no branch.
 */
export const either =
  (name: string, branches: Rule[][]): Rule =>
  (v) => {
    for (const branch of branches) {
      if (branch.every((rule) => rule(v) === undefined)) {
        return;
      }
    }
    return {
      code: "no_match",
      message: `${name} did not match any allowed form.`,
      received: v,
    };
  };

/**
 * Rejects an object that has a key outside the set. The rule checks the keys
 * only.
 */
export const subset =
  (name: string, set: Set<string>): Rule =>
  (v) => {
    if (!object(v)) {
      return;
    }
    for (const key of Object.keys(v)) {
      if (!set.has(key)) {
        return {
          code: "unknown_key",
          message: `${name} contains an unknown key '${key}'.`,
          path: [key],
          expected: [...set],
          received: key,
        };
      }
    }
  };

/**
 * Rejects an object that lacks a key of the set.
 */
export const superset =
  (name: string, set: Set<string>): Rule =>
  (v) => {
    if (!object(v)) {
      return;
    }
    for (const key of set) {
      if (!(key in v)) {
        return {
          code: "missing_key",
          message: `${name} is missing required key '${key}'.`,
          path: [key],
          expected: [...set],
        };
      }
    }
  };

/**
 * Rejects an array that has a duplicate element. The rule compares elements by
 * deep equality.
 */
export const unique =
  (name: string): Rule =>
  (v) => {
    if (!Array.isArray(v)) {
      return;
    }
    for (const [index, item] of v.entries()) {
      const twin = v.findIndex((other) => equals(other, item));
      if (twin !== index) {
        return {
          code: "duplicate",
          message: `${name} lists '${String(item)}' more than once.`,
          path: [String(index)],
          received: item,
        };
      }
    }
  };

/**
 * Rejects an array that lacks a member of the set.
 */
export const exhaustive =
  (name: string, set: Set<string>): Rule =>
  (v) => {
    if (!Array.isArray(v)) {
      return;
    }
    for (const key of set) {
      if (!v.includes(key)) {
        return {
          code: "not_exhaustive",
          message: `${name} is missing '${key}'.`,
          expected: [...set],
          received: v,
        };
      }
    }
  };

/**
 * Rejects a value that is not an array. The rule applies the rules to each
 * element.
 */
export const list =
  (name: string, rules: Rule[]): Rule =>
  (v) => {
    if (!Array.isArray(v)) {
      return {
        code: "not_array",
        message: `${name} must be an array.`,
        received: v,
      };
    }
    for (const [index, item] of v.entries()) {
      for (const rule of rules) {
        const issue = rule(item);
        if (issue) {
          return nest(String(index), issue);
        }
      }
    }
  };

/**
 * Applies the rules to each value of an object.
 */
export const each =
  (rules: Rule[]): Rule =>
  (v) => {
    if (!object(v)) {
      return;
    }
    for (const [key, value] of Object.entries(v)) {
      for (const rule of rules) {
        const issue = rule(value);
        if (issue) {
          return nest(key, issue);
        }
      }
    }
  };

/**
 * Applies the rules of each named field to its value. The rule rejects a key
 * that has no rules.
 */
export const fields =
  (name: string, members: Record<string, Rule[]>): Rule =>
  (v) => {
    if (!object(v)) {
      return;
    }
    for (const key of Object.keys(v)) {
      if (!(key in members)) {
        return {
          code: "unknown_key",
          message: `${name} contains an unknown key '${key}'.`,
          path: [key],
          received: key,
        };
      }
    }
    for (const key of Object.keys(members)) {
      const rules = members[key];
      if (rules && key in v) {
        for (const rule of rules) {
          const issue = rule(v[key]);
          if (issue) {
            return nest(key, issue);
          }
        }
      }
    }
  };

/**
 * Checks an object with the rules of each field. The rule rejects an object
 * that lacks a required key.
 */
export const struct = (
  name: string,
  members: Record<string, Rule[]>,
  required: Set<string>,
): Rule => all([fields(name, members), superset(name, required)]);
