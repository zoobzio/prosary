import type { Contract, DirectiveMatch, Enum, Kind, Match } from "./types";

import { equals, has, within } from "objectively";

/**
 * Checks that a match is a directive match.
 */
export const isDirectiveMatch = (match: Match): match is DirectiveMatch =>
  has("directive", match);

/**
 * Checks that the fields of a raw node equal the values of a `where` map. A
 * value in an array matches any member.
 */
export const fits = (
  raw: Record<string, unknown>,
  where: Record<string, unknown>,
): boolean =>
  Object.entries(where).every(([key, expected]) =>
    Array.isArray(expected)
      ? expected.some((option) => equals(option, raw[key]))
      : equals(expected, raw[key]),
  );

/**
 * Resolves the kind of a raw node. A directive node matches a kind by its
 * `name`. A standard node matches the kinds of its `type`. Among those, the
 * kind whose `where` fits with the most keys wins. A kind with no `where` wins
 * when no `where` fits. Returns `undefined` when no kind claims the node.
 *
 * @param raw - A node with a string `type`.
 * @param base - The contract.
 * @param enums - The sets of the contract.
 */
export const kindOf = <C extends Contract>(
  raw: Record<string, unknown>,
  base: C,
  enums: Enum<C>,
): Kind<C> | undefined => {
  if (typeof raw.type !== "string") {
    return undefined;
  }
  if (within(enums.directiveTypes, raw.type)) {
    return typeof raw.name === "string"
      ? enums.directives.get(raw.name)
      : undefined;
  }
  let best: Kind<C> | undefined;
  let score = -1;
  for (const kind of enums.types.get(raw.type) ?? []) {
    const match = base.kinds[kind]?.match;
    if (!match || isDirectiveMatch(match)) {
      continue;
    }
    if (match.where === undefined) {
      if (score < 0) {
        best = kind;
        score = 0;
      }
      continue;
    }
    const keys = Object.keys(match.where).length;
    if (keys > score && fits(raw, match.where)) {
      best = kind;
      score = keys;
    }
  }
  return best;
};
