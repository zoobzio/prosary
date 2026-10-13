import type { Contract, Meta } from "./types";

import { defineBind } from "./bind";
import { defineEnum } from "./enum";
import { defineRules } from "./rules";
import { defineShape } from "./shape";

/**
 * Derives the {@link Meta} for a contract in four stages. First, the function
 * reads the sets from the kinds. Second, the shape resolves each
 * kind to its attribute slots and its permitted children. Third, the bind
 * walks a tree with the sets and the shape. Fourth, the rules use the sets and
 * the bind.
 *
 * @param base - The contract.
 */
export const defineMeta = <C extends Contract>(base: C): Meta<C> => {
  const enums = defineEnum(base);
  const shape = defineShape(base, enums);
  const bind = defineBind(base, enums, shape);
  const rules = defineRules(base, enums, bind);
  return { enums, shape, bind, rules };
};
