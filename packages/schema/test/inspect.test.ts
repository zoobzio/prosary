import { describe, expect, it } from "vitest";

import { defineAssert } from "../src/assert";
import { defineInspect } from "../src/inspect";
import { defineParse } from "../src/parse";
import { contract, meta, paragraph, text, tree } from "./fixture";

const inspect = defineInspect(defineParse(defineAssert(meta), meta));

describe("defineInspect", () => {
  it("returns a success result with the data", () => {
    expect(inspect.contract(contract)).toEqual({
      success: true,
      data: contract,
    });
    expect(inspect.kind("callout")).toEqual({ success: true, data: "callout" });
    expect(inspect.axis("locale").success).toBe(true);
    expect(inspect.input({ locale: "en", platform: "mac" }).success).toBe(true);
    expect(inspect.reference("#x").success).toBe(true);
    expect(inspect.override({}).success).toBe(true);
    expect(inspect.patch({}).success).toBe(true);
    expect(inspect.layer({ id: "l", name: "L" }).success).toBe(true);
    const node = inspect.node(paragraph(text("x")));
    expect(node.success && node.data.data.kind).toBe("paragraph");
    const document = inspect.document(tree);
    expect(document.success && document.data.children.length).toBe(
      tree.children.length,
    );
  });

  it("returns a failure result with every issue", () => {
    const result = inspect.document({
      type: "root",
      children: [{ type: "html", value: "x" }, { type: "code" }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues.map((i) => i.code)).toEqual([
        "raw_html",
        "missing_attribute",
      ]);
    }
    expect(inspect.kind("ghost").success).toBe(false);
  });

  it("rethrows errors that are not schema errors", () => {
    const broken = defineInspect({
      ...defineParse(defineAssert(meta), meta),
      kind: () => {
        throw new TypeError("boom");
      },
    });
    expect(() => broken.kind("x")).toThrow(TypeError);
  });
});
