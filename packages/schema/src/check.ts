import type { Check, Contract, Domain, Meta, Rule, Validation } from "./types";

/**
 * Builds the {@link Check} bundle. Each validation kind is a boolean type
 * predicate. A kind returns `true` when every rule in its list returns no
 * issue.
 */
export const defineCheck = <C extends Contract>({
  rules,
}: Meta<C>): Check<C> => {
  const check =
    <V extends Validation>(list: Rule[]) =>
    (v: unknown): v is Domain<C>[V] =>
      list.every((rule) => rule(v) === undefined);
  return {
    contract: check<"contract">(rules.contract),
    kind: check<"kind">(rules.kind),
    reference: check<"reference">(rules.reference),
    override: check<"override">(rules.override),
    patch: check<"patch">(rules.patch),
    layer: check<"layer">(rules.layer),
    node: check<"node">(rules.node),
    document: check<"document">(rules.document),
  };
};
