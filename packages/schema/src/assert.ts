import type {
  Assert,
  Contract,
  Document,
  Issue,
  Kind,
  Layer,
  Meta,
  Node,
  Override,
  Patch,
  Reference,
  Result,
  Rule,
} from "./types";

import { SchemaError } from "./error";

/**
 * Builds the {@link Assert} bundle. Each validation kind runs every rule and
 * collects all the {@link Issue}s. The kind throws a {@link SchemaError} when
 * it finds an issue. The `node` and `document` kinds run the bind, so the
 * error holds every issue of the tree.
 */
export const defineAssert = <C extends Contract>({
  rules,
  bind,
}: Meta<C>): Assert<C> => {
  const assert = (v: unknown, list: Rule[]) => {
    const issues = list.reduce<Issue[]>((acc, rule) => {
      const issue = rule(v);
      if (issue) {
        acc.push(issue);
      }
      return acc;
    }, []);
    if (issues.length > 0) {
      throw new SchemaError(issues);
    }
  };
  const bound = (result: Result<unknown>) => {
    if (!result.success) {
      throw new SchemaError(result.issues);
    }
  };
  return {
    contract: (v: unknown): asserts v is Contract => assert(v, rules.contract),
    kind: (v: unknown): asserts v is Kind<C> => assert(v, rules.kind),
    reference: (v: unknown): asserts v is Reference =>
      assert(v, rules.reference),
    override: (v: unknown): asserts v is Override => assert(v, rules.override),
    patch: (v: unknown): asserts v is Patch => assert(v, rules.patch),
    layer: (v: unknown): asserts v is Layer => assert(v, rules.layer),
    node: (v: unknown): asserts v is Node<C> => bound(bind.node(v)),
    document: (v: unknown): asserts v is Document<C> => bound(bind.document(v)),
  };
};
