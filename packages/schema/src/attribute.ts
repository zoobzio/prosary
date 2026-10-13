import type {
  Attribute,
  Contract,
  Found,
  Issue,
  KindShape,
  Reading,
  Rule,
} from "./types";

import { object } from "objectively";

import { DEFAULT_PROTOCOLS, ID_ATTRIBUTE } from "./constant";
import { parseReference } from "./reference";
import {
  all,
  flag,
  integer,
  member,
  numeric,
  range,
  text,
  token,
  url,
} from "./util";

/**
 * Builds the rule for a present attribute value.
 */
export const attributeRule = (name: string, attribute: Attribute): Rule => {
  switch (attribute.type) {
    case "string":
      return text(name);
    case "number":
      return all([
        numeric(name),
        ...(attribute.integer ? [integer(name)] : []),
        range(name, attribute.min, attribute.max),
      ]);
    case "boolean":
      return flag(name);
    case "enum":
      return member(name, new Set(attribute.values));
    case "url":
      return all([
        text(name),
        url(name, new Set(attribute.protocols ?? DEFAULT_PROTOCOLS)),
      ]);
    case "token":
      return token(name);
  }
};

/**
 * Converts the string form of a directive attribute to a number. A string that
 * is not a finite number stays a string, and the rule rejects it.
 */
const toNumber = (v: unknown): unknown => {
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return v;
};

/**
 * Converts the string form of a directive attribute to a boolean. A directive
 * attribute with no value, such as `{draft}`, arrives as `""` or `null` and
 * means `true`.
 */
const toBoolean = (v: unknown): unknown => {
  if (v === "" || v === null || v === "true") {
    return true;
  }
  if (v === "false") {
    return false;
  }
  return v;
};

/**
 * Builds the coercion from the string form of a directive attribute. A
 * standard kind reads typed mdast fields, so its coercion returns the value
 * unchanged.
 */
export const coerce = (
  attribute: Attribute,
  directive: boolean,
): ((v: unknown) => unknown) => {
  if (!directive) {
    return (v) => v;
  }
  switch (attribute.type) {
    case "number":
      return toNumber;
    case "boolean":
      return toBoolean;
    default:
      return (v) => v;
  }
};

/**
 * Reads the attributes of one raw node against the shape of its kind. A
 * directive kind reads the `attributes` map of the node and rejects a name it
 * does not declare, except the reserved id. A standard kind reads the fields
 * of the node and ignores the rest. A missing value takes the default of its
 * slot, or fails when the slot is required. A present value is coerced, then
 * checked by the rule of its slot. A `url` value in reference form is noted
 * for the bind to resolve.
 *
 * @param raw - The node.
 * @param kind - The resolved kind, for the messages.
 * @param shape - The shape of the kind.
 * @param path - The path of the node, for the issues.
 * @returns The attributes, the issues, and the references found.
 */
export const readAttributes = <C extends Contract>(
  raw: Record<string, unknown>,
  kind: string,
  shape: KindShape<C>,
  path: string[],
): Reading => {
  const source: Record<string, unknown> = shape.directive
    ? object(raw.attributes)
      ? raw.attributes
      : {}
    : raw;
  const where = shape.directive ? [...path, "attributes"] : path;
  const attributes: Record<string, unknown> = {};
  const issues: Issue[] = [];
  const references: Found[] = [];

  if (shape.directive) {
    for (const name of Object.keys(source)) {
      if (name !== ID_ATTRIBUTE && !(name in shape.attributes)) {
        issues.push({
          code: "unknown_attribute",
          message: `Kind '${kind}' does not declare attribute '${name}'.`,
          path: [...where, name],
          expected: Object.keys(shape.attributes),
          received: name,
        });
      }
    }
  }

  for (const [name, slot] of Object.entries(shape.attributes)) {
    const present = shape.directive
      ? Object.hasOwn(source, name) && source[name] !== undefined
      : source[name] !== undefined && source[name] !== null;
    const value = present ? slot.coerce(source[name]) : undefined;

    if (value === undefined) {
      if (slot.default !== undefined) {
        attributes[name] = slot.default;
      } else if (slot.required) {
        issues.push({
          code: "missing_attribute",
          message: `Kind '${kind}' requires attribute '${name}'.`,
          path: [...where, name],
        });
      }
      continue;
    }

    const issue = slot.rule(value);
    if (issue) {
      issues.push({
        code: "invalid_attribute",
        message: `Attribute '${name}' is invalid: ${issue.message}`,
        path: [...where, name],
        expected: issue.expected,
        received: value,
      });
      continue;
    }

    attributes[name] = value;
    if (slot.type === "url" && typeof value === "string") {
      const target = parseReference(value);
      if (target) {
        references.push({ target, path: [...where, name] });
      }
    }
  }

  return { attributes, issues, references };
};
