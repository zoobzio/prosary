import type { Contract, Inspect, Parse, Result } from "./types";

import { SchemaError } from "./error";

/**
 * Builds the {@link Inspect} bundle. Each validation kind runs its
 * {@link Parse} and returns a {@link Result}. A success result holds the
 * narrowed value. A failure result holds the issues. Errors of other types
 * propagate to the caller.
 */
export const defineInspect = <C extends Contract>(
  parse: Parse<C>,
): Inspect<C> => {
  const inspect =
    <V>(parseFn: (v: unknown) => V) =>
    (v: unknown): Result<V> => {
      try {
        return { success: true, data: parseFn(v) };
      } catch (error) {
        if (error instanceof SchemaError) {
          return { success: false, issues: error.issues };
        }
        throw error;
      }
    };
  return {
    contract: inspect(parse.contract),
    kind: inspect(parse.kind),
    axis: inspect(parse.axis),
    input: inspect(parse.input),
    reference: inspect(parse.reference),
    override: inspect(parse.override),
    patch: inspect(parse.patch),
    layer: inspect(parse.layer),
    node: inspect(parse.node),
    document: inspect(parse.document),
  };
};
