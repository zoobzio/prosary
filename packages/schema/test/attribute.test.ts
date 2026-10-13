import { describe, expect, it } from "vitest";

import { attributeRule, coerce, readAttributes } from "../src/attribute";
import { defineEnum } from "../src/enum";
import { defineShape } from "../src/shape";
import { contract } from "./fixture";

const shape = defineShape(contract, defineEnum(contract));

describe("attributeRule", () => {
  it("builds a rule for each attribute type", () => {
    expect(attributeRule("a", { type: "string" })(1)?.code).toBe("not_string");
    expect(
      attributeRule("a", { type: "number", min: 1, max: 2, integer: true })(1.5)
        ?.code,
    ).toBe("not_integer");
    expect(
      attributeRule("a", { type: "number", min: 1, max: 2 })(3)?.code,
    ).toBe("out_of_range");
    expect(attributeRule("a", { type: "number" })(3)).toBeUndefined();
    expect(attributeRule("a", { type: "boolean" })("x")?.code).toBe(
      "not_boolean",
    );
    expect(attributeRule("a", { type: "enum", values: ["x"] })("y")?.code).toBe(
      "not_member",
    );
    expect(attributeRule("a", { type: "url" })("ftp://x")?.code).toBe(
      "not_url",
    );
    expect(attributeRule("a", { type: "url" })("https://x")).toBeUndefined();
    expect(
      attributeRule("a", { type: "url", protocols: ["ftp"] })("ftp://x"),
    ).toBeUndefined();
    expect(attributeRule("a", { type: "token" })("x")?.code).toBe(
      "not_reference",
    );
    expect(attributeRule("a", { type: "token" })("{x}")).toBeUndefined();
  });
});

describe("coerce", () => {
  it("coerces directive strings for number and boolean only", () => {
    expect(coerce({ type: "number" }, true)("3")).toBe(3);
    expect(coerce({ type: "number" }, true)("x")).toBe("x");
    expect(coerce({ type: "number" }, true)("")).toBe("");
    expect(coerce({ type: "boolean" }, true)("")).toBe(true);
    expect(coerce({ type: "boolean" }, true)(null)).toBe(true);
    expect(coerce({ type: "boolean" }, true)("true")).toBe(true);
    expect(coerce({ type: "boolean" }, true)("false")).toBe(false);
    expect(coerce({ type: "boolean" }, true)("maybe")).toBe("maybe");
    expect(coerce({ type: "string" }, true)("3")).toBe("3");
  });

  it("does not coerce the fields of a standard kind", () => {
    expect(coerce({ type: "number" }, false)("3")).toBe("3");
    expect(coerce({ type: "boolean" }, false)("")).toBe("");
  });
});

describe("readAttributes", () => {
  it("reads the fields of a standard kind and ignores the rest", () => {
    const read = readAttributes(
      { type: "code", lang: "ts", value: "x", meta: "m" },
      "code",
      shape.kinds.code,
      ["children", "0"],
    );
    expect(read).toEqual({
      attributes: { lang: "ts", value: "x" },
      issues: [],
      references: [],
    });
  });

  it("treats null as a missing field of a standard kind", () => {
    const read = readAttributes(
      { type: "code", lang: null, value: "x" },
      "code",
      shape.kinds.code,
      [],
    );
    expect(read.attributes).toEqual({ value: "x" });
    expect(read.issues).toEqual([]);
  });

  it("reads, coerces, and defaults the attributes of a directive", () => {
    const read = readAttributes(
      {
        type: "containerDirective",
        name: "callout",
        attributes: { draft: null, weight: "3", id: "x" },
      },
      "callout",
      shape.kinds.callout,
      ["children", "2"],
    );
    expect(read.attributes).toEqual({ kind: "note", draft: true, weight: 3 });
    expect(read.issues).toEqual([]);
  });

  it("reads a directive with no attributes map", () => {
    const read = readAttributes(
      { type: "leafDirective", name: "rule" },
      "rule",
      shape.kinds.rule,
      [],
    );
    expect(read).toEqual({ attributes: {}, issues: [], references: [] });
  });

  it("reports a missing required attribute at its path", () => {
    const read = readAttributes(
      { type: "code", lang: "ts" },
      "code",
      shape.kinds.code,
      ["children", "0"],
    );
    expect(read.issues).toEqual([
      {
        code: "missing_attribute",
        message: "Kind 'code' requires attribute 'value'.",
        path: ["children", "0", "value"],
      },
    ]);
  });

  it("reports an invalid attribute with the atom message", () => {
    const read = readAttributes(
      { type: "containerDirective", attributes: { kind: "loud", weight: "x" } },
      "callout",
      shape.kinds.callout,
      ["children", "0"],
    );
    expect(read.issues.map((i) => i.code)).toEqual([
      "invalid_attribute",
      "invalid_attribute",
    ]);
    expect(read.issues[0]?.path).toEqual([
      "children",
      "0",
      "attributes",
      "kind",
    ]);
    expect(read.issues[0]?.message).toContain("must be a member");
    expect(read.issues[1]?.received).toBe("x");
    expect(read.attributes).toEqual({});
  });

  it("reports an undeclared directive attribute, except the reserved id", () => {
    const read = readAttributes(
      { type: "containerDirective", attributes: { class: "big", id: "ok" } },
      "callout",
      shape.kinds.callout,
      [],
    );
    expect(read.issues.map((i) => i.code)).toEqual(["unknown_attribute"]);
    expect(read.issues[0]?.path).toEqual(["attributes", "class"]);
  });

  it("notes a url attribute in reference form", () => {
    const read = readAttributes(
      { type: "link", url: "doc:other#intro" },
      "link",
      shape.kinds.link,
      ["children", "1"],
    );
    expect(read.references).toEqual([
      {
        target: { document: "other", node: "intro" },
        path: ["children", "1", "url"],
      },
    ]);
    expect(
      readAttributes(
        { type: "link", url: "https://x" },
        "link",
        shape.kinds.link,
        [],
      ).references,
    ).toEqual([]);
  });
});
