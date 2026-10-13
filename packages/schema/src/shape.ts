import type {
  Attribute,
  Content,
  Contract,
  Enum,
  Kind,
  KindShape,
  Shape,
  Slot,
} from "./types";

import { remap, within } from "objectively";

import { attributeRule, coerce } from "./attribute";
import { isDirectiveMatch } from "./match";

/**
 * Builds the {@link Slot} of one attribute. An attribute is required unless
 * `required` is `false` or the definition has a `default`.
 */
const slot = (
  name: string,
  attribute: Attribute,
  directive: boolean,
): Slot => ({
  type: attribute.type,
  rule: attributeRule(name, attribute),
  required: attribute.required !== false && attribute.default === undefined,
  default: attribute.default,
  coerce: coerce(attribute, directive),
});

/**
 * Resolves a content model to the set of permitted kinds. `none` resolves to
 * `undefined`. An explicit list keeps the names that are kinds of the
 * contract. The `contract` rules reject a name that is not.
 */
const permitted = <C extends Contract>(
  content: Content,
  enums: Enum<C>,
): Set<Kind<C>> | undefined => {
  if (content === "none") {
    return undefined;
  }
  if (content === "inline") {
    return enums.inline;
  }
  if (content === "block") {
    return enums.block;
  }
  return new Set(content.filter(within(enums.kinds)));
};

/**
 * Builds the {@link Shape} for a contract. Each kind gets a slot per attribute
 * and its set of permitted child kinds. The root gets its permitted kinds from
 * the `root` content model of the contract, which defaults to `block`.
 *
 * @param base - The contract.
 * @param enums - The sets of the contract.
 */
export const defineShape = <C extends Contract>(
  base: C,
  enums: Enum<C>,
): Shape<C> => {
  const kinds = remap<C["kinds"], Shape<C>["kinds"]>(
    base.kinds,
    (definition: C["kinds"][Kind<C>]): KindShape<C> => {
      const directive = isDirectiveMatch(definition.match);
      const attributes: Record<string, Slot> = {};
      for (const [name, attribute] of Object.entries(
        definition.attributes ?? {},
      )) {
        attributes[name] = slot(name, attribute, directive);
      }
      return {
        attributes,
        permitted: permitted(definition.content, enums),
        directive,
      };
    },
  );
  return {
    kinds,
    root: permitted(base.root ?? "block", enums) ?? new Set(),
  };
};
