import { object } from "objectively";

import { HEADING_TYPE, ID_ATTRIBUTE } from "./constant";

/**
 * Returns the concatenated text of a raw node and its descendants. The
 * function reads the `value` of each node that has a string value.
 */
export const textOf = (raw: unknown): string => {
  if (!object(raw)) {
    return "";
  }
  if (typeof raw.value === "string") {
    return raw.value;
  }
  if (Array.isArray(raw.children)) {
    return raw.children.map(textOf).join("");
  }
  return "";
};

/**
 * Makes a slug of a text. The slug is lower case. Letters, digits, `-`, and
 * `_` stay. Spaces become `-`. Every other character is removed. The slug of
 * a text with no such characters is empty.
 */
export const slug = (text: string): string =>
  text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s+/g, "-");

/**
 * Returns the explicit id of a raw node. An explicit id is a non-empty string
 * in `data.id`, or in the reserved `id` attribute of a directive. Returns
 * `undefined` when the node has neither.
 */
export const explicit = (raw: unknown): string | undefined => {
  if (!object(raw)) {
    return undefined;
  }
  if (object(raw.data) && typeof raw.data.id === "string" && raw.data.id) {
    return raw.data.id;
  }
  if (object(raw.attributes)) {
    const id = raw.attributes[ID_ATTRIBUTE];
    if (typeof id === "string" && id) {
      return id;
    }
  }
  return undefined;
};

/**
 * Makes the structural id of a node from the id of its parent, its kind, and
 * its ordinal among the siblings of the same kind. The root has the empty id,
 * so a child of the root has no prefix.
 */
export const structural = (
  parent: string,
  kind: string,
  ordinal: number,
): string => `${parent ? `${parent}/` : ""}${kind}[${ordinal}]`;

/**
 * Computes the id of a raw node. The function takes the first rule that
 * applies: the explicit id, the slug of a heading, then the structural id.
 */
export const identify = (
  raw: unknown,
  kind: string,
  parent: string,
  ordinal: number,
): string => {
  const given = explicit(raw);
  if (given !== undefined) {
    return given;
  }
  if (object(raw) && raw.type === HEADING_TYPE) {
    const made = slug(textOf(raw));
    if (made) {
      return made;
    }
  }
  return structural(parent, kind, ordinal);
};
