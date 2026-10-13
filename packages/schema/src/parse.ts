import type { Assert, Contract, Meta, Parse } from "./types";

import { SchemaError } from "./error";

/**
 * Builds the {@link Parse} bundle. Each validation kind asserts the value and
 * returns it narrowed to the kind type. The `node` and `document` kinds return
 * the bound tree from the bind. The {@link SchemaError} from {@link Assert}
 * propagates to the caller.
 */
export const defineParse = <C extends Contract>(
  assert: Assert<C>,
  { bind }: Meta<C>,
): Parse<C> => {
  return {
    contract: (v: unknown) => {
      assert.contract(v);
      return v;
    },
    kind: (v: unknown) => {
      assert.kind(v);
      return v;
    },
    axis: (v: unknown) => {
      assert.axis(v);
      return v;
    },
    input: (v: unknown) => {
      assert.input(v);
      return v;
    },
    reference: (v: unknown) => {
      assert.reference(v);
      return v;
    },
    override: (v: unknown) => {
      assert.override(v);
      return v;
    },
    patch: (v: unknown) => {
      assert.patch(v);
      return v;
    },
    layer: (v: unknown) => {
      assert.layer(v);
      return v;
    },
    node: (v: unknown) => {
      const result = bind.node(v);
      if (!result.success) {
        throw new SchemaError(result.issues);
      }
      return result.data;
    },
    document: (v: unknown) => {
      const result = bind.document(v);
      if (!result.success) {
        throw new SchemaError(result.issues);
      }
      return result.data;
    },
  };
};
