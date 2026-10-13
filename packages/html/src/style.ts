import type { Contract, Issue, Kind, Schema } from "@prosary/schema";
import type { Style, StyleOptions, Styled } from "./types";

import { entries, object, within } from "objectively";

import { CLASS_NAME, CSS_BREAKOUT, PREFIX, PROPERTY_NAME } from "./constant";
import { InvalidStyleError } from "./error";

/**
 * Checks the declarations of a role. Each property must be a CSS property
 * name. Each value must be a string with no breakout sequence.
 */
const checkDeclarations = (declarations: unknown, path: string[]): Issue[] => {
  if (!object(declarations)) {
    return [
      {
        code: "not_object",
        message: "Declarations must be an object.",
        path,
        received: declarations,
      },
    ];
  }
  const issues: Issue[] = [];
  for (const [property, value] of Object.entries(declarations)) {
    if (!PROPERTY_NAME.test(property)) {
      issues.push({
        code: "type_mismatch",
        message: `'${property}' is not a CSS property name.`,
        path: [...path, property],
        received: property,
      });
    }
    if (typeof value !== "string") {
      issues.push({
        code: "not_string",
        message: "A declaration value must be a string.",
        path: [...path, property],
        received: value,
      });
    } else if (CSS_BREAKOUT.test(value)) {
      issues.push({
        code: "css_breakout",
        message: "A declaration value must not contain CSS breakout sequences.",
        path: [...path, property],
        expected: CSS_BREAKOUT.source,
        received: value,
      });
    }
  }
  return issues;
};

/**
 * Writes one CSS rule.
 */
const rule = (
  selector: string,
  declarations: Record<string, unknown>,
): string => {
  const body = Object.entries(declarations)
    .map(([property, value]) => `  ${property}: ${String(value)};`)
    .join("\n");
  return `${selector} {\n${body}\n}`;
};

/**
 * Checks a style against the contract of a schema and returns the
 * {@link Styled} form. Each kind, role, variant attribute, and variant value
 * must exist in the contract. A bound class name must be a valid class name.
 * Declarations must have CSS property names and values with no breakout
 * sequence. Throws {@link InvalidStyleError} with every issue.
 *
 * @param schema - The schema of the contract.
 * @param style - The style.
 * @param options - The class prefix.
 */
export const defineStyle = <C extends Contract>(
  schema: Schema<C>,
  style: Style<C>,
  options: StyleOptions = {},
): Styled<C> => {
  const prefix = options.prefix ?? PREFIX;
  const { enums } = schema.meta;
  const issues: Issue[] = [];

  for (const [kind, kindStyle] of Object.entries(style)) {
    if (!within(enums.kinds, kind)) {
      issues.push({
        code: "not_member",
        message: `'${kind}' is not a kind of the contract.`,
        path: [kind],
        expected: [...enums.kinds],
        received: kind,
      });
      continue;
    }
    const definition = schema.base.kinds[kind];
    const roles = new Set(definition?.roles ?? []);
    const attributes = definition?.attributes ?? {};
    for (const [role, binding] of Object.entries(kindStyle?.roles ?? {})) {
      const path = [kind, "roles", role];
      if (!roles.has(role)) {
        issues.push({
          code: "not_member",
          message: `'${role}' is not a role of kind '${kind}'.`,
          path,
          expected: [...roles],
          received: role,
        });
      } else if (typeof binding === "string") {
        if (!CLASS_NAME.test(binding)) {
          issues.push({
            code: "type_mismatch",
            message: `'${binding}' is not a class name.`,
            path,
            received: binding,
          });
        }
      } else {
        issues.push(...checkDeclarations(binding, path));
      }
    }
    for (const [name, byValue] of Object.entries(kindStyle?.variants ?? {})) {
      const path = [kind, "variants", name];
      const attribute = attributes[name];
      if (attribute === undefined || attribute.type !== "enum") {
        issues.push({
          code: "not_member",
          message: `'${name}' is not an enum attribute of kind '${kind}'.`,
          path,
          received: name,
        });
        continue;
      }
      for (const [value, byRole] of Object.entries(byValue ?? {})) {
        const at = [...path, value];
        if (!attribute.values.includes(value)) {
          issues.push({
            code: "not_member",
            message: `'${value}' is not a value of attribute '${name}'.`,
            path: at,
            expected: [...attribute.values],
            received: value,
          });
          continue;
        }
        for (const [role, declarations] of Object.entries(byRole ?? {})) {
          if (!roles.has(role)) {
            issues.push({
              code: "not_member",
              message: `'${role}' is not a role of kind '${kind}'.`,
              path: [...at, role],
              expected: [...roles],
              received: role,
            });
            continue;
          }
          issues.push(...checkDeclarations(declarations, [...at, role]));
        }
      }
    }
  }

  if (issues.length > 0) {
    throw new InvalidStyleError(issues);
  }

  const className = (kind: Kind<C>): string => `${prefix}-${kind}`;

  const role = (kind: Kind<C>, name: string): string => {
    const roles: Record<string, unknown> | undefined = style[kind]?.roles;
    const bound = roles?.[name];
    return typeof bound === "string" ? bound : `${className(kind)}-${name}`;
  };

  /* One rule per role with declarations, then one rule per variant value and
     role. A variant rule matches the role class on the element of the kind
     and on its descendants. */
  const sheet = (): string => {
    const rules: string[] = [];
    for (const [kind, kindStyle] of entries(style)) {
      if (kindStyle === undefined) {
        continue;
      }
      for (const [name, binding] of Object.entries(kindStyle.roles ?? {})) {
        if (object(binding)) {
          rules.push(rule(`.${role(kind, name)}`, binding));
        }
      }
      for (const [attribute, byValue] of Object.entries(
        kindStyle.variants ?? {},
      )) {
        for (const [value, byRole] of Object.entries(byValue ?? {})) {
          const variant = `.${className(kind)}[data-${attribute}="${value}"]`;
          for (const [name, declarations] of Object.entries(byRole ?? {})) {
            if (object(declarations)) {
              const target = `.${role(kind, name)}`;
              rules.push(
                rule(`${variant}${target}, ${variant} ${target}`, declarations),
              );
            }
          }
        }
      }
    }
    return rules.join("\n\n");
  };

  return { schema, base: style, prefix, className, role, sheet };
};
