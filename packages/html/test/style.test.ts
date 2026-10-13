import { describe, expect, it } from "vitest";

import { InvalidStyleError } from "../src/error";
import { defineStyle } from "../src/style";
import { schema, style } from "./fixture";

const styled = defineStyle(schema, style);

describe("defineStyle", () => {
  it("names the class of a kind and the class of a role", () => {
    expect(styled.className("callout")).toBe("p-callout");
    expect(styled.role("callout", "border")).toBe("p-callout-border");
    expect(styled.role("blockquote", "text")).toBe("prose-quote");
    expect(styled.role("heading", "text")).toBe("p-heading-text");
    expect(styled.schema).toBe(schema);
    expect(styled.base).toBe(style);
  });

  it("takes a prefix", () => {
    const custom = defineStyle(schema, {}, { prefix: "doc" });
    expect(custom.className("paragraph")).toBe("doc-paragraph");
    expect(custom.role("paragraph", "text")).toBe("doc-paragraph-text");
    expect(custom.sheet()).toBe("");
  });

  it("writes one rule per role with declarations and per variant", () => {
    expect(styled.sheet()).toBe(
      [
        ".p-paragraph-text {\n  color: var(--color-ink);\n  font: var(--type-body);\n}",
        ".p-blockquote-border {\n  border-left: 3px solid var(--color-accent);\n}",
        ".p-callout-border {\n  border: 1px solid var(--color-line);\n}",
        ".p-callout-marker {\n  color: var(--color-accent);\n}",
        '.p-callout[data-kind="warning"].p-callout-border, .p-callout[data-kind="warning"] .p-callout-border {\n  border-color: var(--color-warn);\n}',
        '.p-callout[data-kind="warning"].p-callout-marker, .p-callout[data-kind="warning"] .p-callout-marker {\n  color: var(--color-warn);\n}',
      ].join("\n\n"),
    );
  });

  it("rejects an unknown kind, role, attribute, or value", () => {
    const codes = (bad: unknown) => {
      try {
        defineStyle(schema, bad as never);
        return [];
      } catch (error) {
        if (error instanceof InvalidStyleError) {
          return error.issues.map((i) => `${i.code}:${i.path?.join(".")}`);
        }
        throw error;
      }
    };
    expect(codes({ ghost: {} })).toEqual(["not_member:ghost"]);
    expect(codes({ callout: { roles: { ghost: {} } } })).toEqual([
      "not_member:callout.roles.ghost",
    ]);
    expect(codes({ callout: { variants: { title: {} } } })).toEqual([
      "not_member:callout.variants.title",
    ]);
    expect(codes({ callout: { variants: { kind: { loud: {} } } } })).toEqual([
      "not_member:callout.variants.kind.loud",
    ]);
    expect(
      codes({ callout: { variants: { kind: { note: { ghost: {} } } } } }),
    ).toEqual(["not_member:callout.variants.kind.note.ghost"]);
  });

  it("rejects a bad class name, property, value, or breakout", () => {
    const codes = (bad: unknown) => {
      try {
        defineStyle(schema, bad as never);
        return [];
      } catch (error) {
        if (error instanceof InvalidStyleError) {
          return error.issues.map((i) => i.code);
        }
        throw error;
      }
    };
    expect(codes({ callout: { roles: { border: "bad class" } } })).toEqual([
      "type_mismatch",
    ]);
    expect(
      codes({ callout: { roles: { border: { "bad prop": "x" } } } }),
    ).toEqual(["type_mismatch"]);
    expect(codes({ callout: { roles: { border: { color: 1 } } } })).toEqual([
      "not_string",
    ]);
    expect(
      codes({
        callout: {
          roles: { border: { color: "red; } body { display: none" } },
        },
      }),
    ).toEqual(["css_breakout"]);
    expect(
      codes({ callout: { roles: { border: { color: "url(x)" } } } }),
    ).toEqual(["css_breakout"]);
    expect(codes({ callout: { roles: { border: 1 } } })).toEqual([
      "not_object",
    ]);
    expect(
      codes({ callout: { variants: { kind: { note: { border: 1 } } } } }),
    ).toEqual(["not_object"]);
  });

  it("collects every issue", () => {
    try {
      defineStyle(schema, {
        ghost: {},
        callout: { roles: { ghost: {} } },
      } as never);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidStyleError);
      expect((error as InvalidStyleError).issues).toHaveLength(2);
    }
  });
});
