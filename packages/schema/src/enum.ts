import type { Contract, Enum, Kind } from "./types";

import { entries, keys } from "objectively";

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
 * kinds.
 *
 * @param base - The contract whose kinds define the vocabulary.
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

  return {
    kinds,
    inline,
    block,
    types,
    directives,
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
