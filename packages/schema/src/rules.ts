import type {
  Attribute,
  Bind,
  Contract,
  Enum,
  Issue,
  Rule,
  Rules,
} from "./types";

import { equals, object } from "objectively";

import { ID_ATTRIBUTE } from "./constant";
import { parseReference } from "./reference";
import { attributeRule } from "./attribute";
import {
  all,
  container,
  each,
  either,
  fields,
  filled,
  flag,
  list,
  member,
  nest,
  numeric,
  struct,
  subset,
  superset,
  text,
  unique,
} from "./util";

/**
 * Builds the runtime {@link Rules} for a contract. The function makes a list
 * of rules for each validation kind with the atoms in `util`. The `contract`
 * rules check the semantics that the types do not: the content lists, the
 * attribute defaults, and the duplicate matches. The
 * `node` and `document` rules run the bind and return its first issue.
 *
 * @param base - The contract.
 * @param enums - The sets of the contract.
 * @param bind - The bind of the contract.
 */
export const defineRules = <C extends Contract>(
  base: C,
  enums: Enum<C>,
  bind: Bind<C>,
): Rules => {
  /* ── contract ──────────────────────────────────────────────────────── */

  const content = either("Content", [
    [member("Content", enums.models)],
    [list("Content", [member("Kind", enums.kinds)])],
  ]);

  const matchRule = either("Match", [
    [
      fields("Match", {
        type: [text("Type"), filled("Type")],
        where: [container("Where")],
      }),
      superset("Match", new Set(["type"])),
    ],
    [
      fields("Match", { directive: [text("Directive"), filled("Directive")] }),
      superset("Match", new Set(["directive"])),
    ],
  ]);

  /* An enum attribute needs at least one value. */
  const enumValues: Rule = (v) => {
    if (object(v) && v.type === "enum") {
      if (!Array.isArray(v.values) || v.values.length === 0) {
        return {
          code: "missing_key",
          message: "An enum attribute must list at least one value.",
          path: ["values"],
          received: v.values,
        };
      }
    }
  };

  /* A number attribute cannot have a floor above its ceiling. */
  const bounds: Rule = (v) => {
    if (
      object(v) &&
      typeof v.min === "number" &&
      typeof v.max === "number" &&
      v.min > v.max
    ) {
      return {
        code: "out_of_range",
        message: "min must not be greater than max.",
        path: ["min"],
        expected: [undefined, v.max],
        received: v.min,
      };
    }
  };

  const attributeShape = all([
    container("Attribute"),
    struct(
      "Attribute",
      {
        type: [member("Attribute type", enums.attributeTypes)],
        required: [flag("required")],
        default: [],
        values: [
          list("values", [text("Value"), filled("Value")]),
          unique("values"),
        ],
        min: [numeric("min")],
        max: [numeric("max")],
        integer: [flag("integer")],
        protocols: [
          list("protocols", [text("Protocol"), filled("Protocol")]),
          unique("protocols"),
        ],
      },
      new Set(["type"]),
    ),
    enumValues,
    bounds,
  ]);

  /* The shape rules passed, so the value is an attribute definition. */
  const isAttribute = (v: unknown): v is Attribute =>
    attributeShape(v) === undefined;

  /* A default must satisfy the rule of its own attribute. */
  const defaulted: Rule = (v) => {
    if (isAttribute(v) && v.default !== undefined) {
      const issue = attributeRule("default", v)(v.default);
      if (issue) {
        return nest("default", issue);
      }
    }
  };

  const attribute = all([attributeShape, defaulted]);

  /* The `id` attribute is reserved for the explicit id of a directive. */
  const reserved: Rule = (v) => {
    if (object(v) && ID_ATTRIBUTE in v) {
      return {
        code: "unknown_key",
        message: `Attribute '${ID_ATTRIBUTE}' is reserved for the node id.`,
        path: [ID_ATTRIBUTE],
        received: ID_ATTRIBUTE,
      };
    }
  };

  const definition = all([
    container("Kind"),
    struct(
      "Kind",
      {
        match: [container("Match"), matchRule],
        level: [member("Level", enums.levels)],
        content: [content],
        attributes: [container("Attributes"), reserved, each([attribute])],
        roles: [list("Roles", [text("Role"), filled("Role")]), unique("Roles")],
      },
      enums.requiredDefinitionKeys,
    ),
  ]);

  /* Two kinds cannot claim the same nodes. */
  const distinct: Rule = (v) => {
    if (!object(v) || !object(v.kinds)) {
      return;
    }
    const seen: [string, unknown][] = [];
    for (const [kind, def] of Object.entries(v.kinds)) {
      if (!object(def) || !object(def.match)) {
        continue;
      }
      const m = def.match;
      const twin = seen.find(([, other]) => equals(other, m));
      if (twin) {
        return {
          code: "duplicate",
          message: `Kinds '${twin[0]}' and '${kind}' have the same match.`,
          path: ["kinds", kind, "match"],
          received: m,
        } satisfies Issue;
      }
      seen.push([kind, m]);
    }
  };

  const contract = [
    container("Contract"),
    subset("Contract", enums.contractKeys),
    struct(
      "Contract",
      {
        kinds: [container("Kinds"), each([definition])],
        root: [content],
      },
      new Set(["kinds"]),
    ),
    distinct,
  ];

  const reference: Rule = (v) => {
    if (typeof v === "string" && parseReference(v) === undefined) {
      return {
        code: "not_reference",
        message: "Reference must be doc:<document>#<node> or #<node>.",
        received: v,
      };
    }
  };

  /* ── overlays ──────────────────────────────────────────────────────── */

  const firstOf =
    (run: (v: unknown) => { success: boolean; issues?: Issue[] }): Rule =>
    (v) => {
      const result = run(v);
      return result.success ? undefined : result.issues?.[0];
    };

  const nodeRule = firstOf(bind.node);

  const override = [
    container("Override"),
    fields("Override", {
      attributes: [container("Attributes")],
      children: [list("Children", [nodeRule])],
    }),
  ];

  const overlay = [
    container("Documents"),
    each([container("Overrides"), each(override)]),
  ];

  const overlayFields: Record<string, Rule[]> = {
    id: [text("Identifier"), filled("Identifier")],
    name: [text("Name"), filled("Name")],
    documents: overlay,
  };

  return {
    contract,
    kind: [text("Kind"), member("Kind", enums.kinds)],
    reference: [text("Reference"), reference],
    override,
    patch: [container("Patch"), fields("Patch", overlayFields)],
    layer: [
      container("Layer"),
      struct("Layer", overlayFields, enums.layerKeys),
    ],
    node: [nodeRule],
    document: [firstOf(bind.document)],
  };
};
