import { describe, expect, it } from "vitest";

import { defineAssert } from "../src/assert";
import { SchemaError } from "../src/error";
import type { Assert, Code } from "../src/types";
import { contract, meta, paragraph, text, tree } from "./fixture";

const assert: Assert<typeof contract> = defineAssert(meta);

/** Returns the issue codes of the error that the assertion throws. Returns `[]` when the assertion passes. */
const thrownCodes = (run: () => void): Code[] => {
  try {
    run();
    return [];
  } catch (error) {
    if (error instanceof SchemaError) {
      return error.issues.map((issue) => issue.code);
    }
    throw error;
  }
};

describe("defineAssert", () => {
  it("returns without throwing for a valid value of every kind", () => {
    expect(() => assert.contract(contract)).not.toThrow();
    expect(() => assert.kind("callout")).not.toThrow();
    expect(() => assert.reference("doc:a#b")).not.toThrow();
    expect(() => assert.override({})).not.toThrow();
    expect(() => assert.patch({})).not.toThrow();
    expect(() => assert.layer({ id: "l", name: "L" })).not.toThrow();
    expect(() => assert.node(paragraph(text("x")))).not.toThrow();
    expect(() => assert.document(tree)).not.toThrow();
  });

  it("throws a SchemaError carrying issues for an invalid value", () => {
    expect(thrownCodes(() => assert.kind("ghost"))).toEqual(["not_member"]);
    expect(thrownCodes(() => assert.kind(1))).toEqual([
      "not_string",
      "not_member",
    ]);
    expect(thrownCodes(() => assert.layer({}))).toEqual(["missing_key"]);
  });

  it("collects every issue of a tree for node and document", () => {
    expect(
      thrownCodes(() =>
        assert.document({
          type: "root",
          children: [{ type: "html", value: "x" }, { type: "code" }],
        }),
      ),
    ).toEqual(["raw_html", "missing_attribute"]);
    expect(
      thrownCodes(() =>
        assert.node(paragraph({ type: "html", value: "x" }, paragraph())),
      ),
    ).toEqual(["raw_html", "invalid_child"]);
  });

  it("formats the error message with paths", () => {
    try {
      assert.document({ type: "root", children: [{ type: "code" }] });
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaError);
      expect((error as Error).message).toBe(
        "children.0.value: Kind 'code' requires attribute 'value'.",
      );
    }
  });
});
