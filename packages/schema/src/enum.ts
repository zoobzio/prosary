import type { Axis, Context, Contract, Default, Enum, Kind } from "./types";

import { entries, keys, remap } from "objectively";

import {
  ATTRIBUTE_TYPES,
  CONTRACT_KEYS,
  DEFINITION_KEYS,
  DIRECTIVE_TYPES,
  LAYER_KEYS,
  LEVELS,
  MODELS,
  OVERRIDE_KEYS,
  PATCH_KEYS,
  REQUIRED_DEFINITION_KEYS,
} from "./constant";
import { isDirectiveMatch } from "./match";

/**
 * Builds the {@link Enum} for a contract. The specification members are the
 * same for all contracts. The function reads the contract members from the
 * kinds and the axes.
 *
 * @param base - The contract whose kinds and axes define the vocabulary.
 */
export const defineEnum = <C extends Contract>(base: C): Enum<C> => {
  const kinds = new Set(keys(base.kinds));
  const inline = new Set<Kind<C>>();
  const block = new Set<Kind<C>>();
  const types = new Map<string, Kind<C>[]>();
  const directives = new Map<string, Kind<C>>();

  for (const [name, definition] of entries(base.kinds)) {
    if (definition.level === "inline") {
      inline.add(name);
    } else {
      block.add(name);
    }
    if (isDirectiveMatch(definition.match)) {
      directives.set(definition.match.directive, name);
    } else {
      const found = types.get(definition.match.type) ?? [];
      found.push(name);
      types.set(definition.match.type, found);
    }
  }

  const axes = new Set(keys(base.axes));
  const contexts = remap<C["axes"], Enum<C>["contexts"]>(
    base.axes,
    <A extends Axis<C>>(axis: C["axes"][A]): Set<Context<C, A>> =>
      new Set(axis.contexts),
  );
  const defaults = remap<C["axes"], Enum<C>["defaults"]>(
    base.axes,
    <A extends Axis<C>>(axis: C["axes"][A]): Default<C, A> => axis.default,
  );

  return {
    kinds,
    inline,
    block,
    types,
    directives,
    axes,
    contexts,
    defaults,
    levels: new Set(LEVELS),
    models: new Set(MODELS),
    attributeTypes: new Set(ATTRIBUTE_TYPES),
    directiveTypes: new Set(DIRECTIVE_TYPES),
    contractKeys: new Set(CONTRACT_KEYS),
    definitionKeys: new Set(DEFINITION_KEYS),
    requiredDefinitionKeys: new Set(REQUIRED_DEFINITION_KEYS),
    patchKeys: new Set(PATCH_KEYS),
    layerKeys: new Set(LAYER_KEYS),
    overrideKeys: new Set(OVERRIDE_KEYS),
  };
};
