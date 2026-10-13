import { describe, expect, it } from "vitest";

import { defineCheck } from "../src/check";
import { contract, meta, paragraph, text, tree } from "./fixture";

const check = defineCheck(meta);

describe("defineCheck", () => {
  it("returns true for a valid value of every kind", () => {
    expect(check.contract(contract)).toBe(true);
    expect(check.kind("callout")).toBe(true);
    expect(check.reference("#x")).toBe(true);
    expect(check.override({})).toBe(true);
    expect(check.patch({})).toBe(true);
    expect(check.layer({ id: "l", name: "L" })).toBe(true);
    expect(check.node(paragraph(text("x")))).toBe(true);
    expect(check.document(tree)).toBe(true);
  });

  it("returns false for an invalid value", () => {
    expect(check.contract({})).toBe(false);
    expect(check.kind("ghost")).toBe(false);
    expect(check.reference("x")).toBe(false);
    expect(check.override({ extra: 1 })).toBe(false);
    expect(check.patch({ id: 1 })).toBe(false);
    expect(check.layer({})).toBe(false);
    expect(check.node({ type: "html", value: "x" })).toBe(false);
    expect(check.document({ type: "root", children: [text("loose")] })).toBe(
      false,
    );
  });

  it("narrows the type on true", () => {
    const value: unknown = "callout";
    if (check.kind(value)) {
      const kind: "callout" | "text" | (string & keyof typeof contract.kinds) =
        value;
      expect(kind).toBe("callout");
    }
  });
});
