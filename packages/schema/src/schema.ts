import type { Assert, Contract, Schema } from "./types";

import { defineAssert } from "./assert";
import { defineCheck } from "./check";
import { defineInspect } from "./inspect";
import { defineMeta } from "./meta";
import { defineParse } from "./parse";

/**
 * Builds the runtime validation {@link Schema} for a contract.
 *
 * `meta` holds the sets of the contract, the shape of each kind, the bind, and
 * the rules of each validation kind. `bind` binds a raw mdast tree and returns
 * every issue. `check` runs the rules as boolean type predicates. `assert`
 * collects every {@link Issue} and throws a {@link SchemaError}. `parse`
 * asserts the value and returns it narrowed. `inspect` returns the outcome as
 * a {@link Result}.
 *
 * The function validates the contract against the `contract` kind before it
 * returns the schema. An invalid contract throws at construction.
 *
 * @param base - The contract whose kinds define the vocabulary.
 * @returns A schema with the sets, the bind, and the check, assert, parse, and
 *   inspect bundles. The bundles use the kind names of the
 *   contract.
 */
export const defineContract = <const C extends Contract>(
  base: C,
): Schema<C> => {
  const meta = defineMeta(base);
  const check = defineCheck(meta);
  const assert: Assert<C> = defineAssert(meta);
  const parse = defineParse(assert, meta);
  const inspect = defineInspect(parse);

  assert.contract(base);

  return {
    base,
    meta,
    bind: meta.bind.document,
    check,
    assert,
    parse,
    inspect,
  };
};
