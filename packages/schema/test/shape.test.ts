import { describe, expect, it } from "vitest";

import { defineEnum } from "../src/enum";
import { defineShape } from "../src/shape";
import { contract } from "./fixture";

const enums = defineEnum(contract);
const shape = defineShape(contract, enums);

describe("defineShape", () => {
  it("gives each kind a slot per attribute", () => {
    expect(Object.keys(shape.kinds.callout.attributes)).toEqual([
      "kind",
      "draft",
      "weight",
      "accent",
    ]);
    expect(shape.kinds.paragraph.attributes).toEqual({});
  });

  it("marks a slot required unless required is false or a default exists", () => {
    expect(shape.kinds.code.attributes.value?.required).toBe(true);
    expect(shape.kinds.code.attributes.lang?.required).toBe(false);
    expect(shape.kinds.callout.attributes.kind?.required).toBe(false);
    expect(shape.kinds.callout.attributes.kind?.default).toBe("note");
  });

  it("records the type and the rule of each slot", () => {
    expect(shape.kinds.link.attributes.url?.type).toBe("url");
    expect(shape.kinds.heading.attributes.depth?.rule(4)?.code).toBe(
      "out_of_range",
    );
    expect(shape.kinds.heading.attributes.depth?.rule(2)).toBeUndefined();
  });

  it("coerces directive slots and leaves standard slots alone", () => {
    expect(shape.kinds.callout.attributes.weight?.coerce("3")).toBe(3);
    expect(shape.kinds.callout.attributes.draft?.coerce(null)).toBe(true);
    expect(shape.kinds.heading.attributes.depth?.coerce("3")).toBe("3");
  });

  it("marks the directive kinds", () => {
    expect(shape.kinds.callout.directive).toBe(true);
    expect(shape.kinds.badge.directive).toBe(true);
    expect(shape.kinds.heading.directive).toBe(false);
  });

  it("resolves the content model of each kind to its permitted kinds", () => {
    expect(shape.kinds.text.permitted).toBeUndefined();
    expect(shape.kinds.rule.permitted).toBeUndefined();
    expect(shape.kinds.paragraph.permitted).toBe(enums.inline);
    expect(shape.kinds.callout.permitted).toBe(enums.block);
    expect([...(shape.kinds.blockquote.permitted ?? [])]).toEqual([
      "paragraph",
    ]);
  });

  it("defaults the root to the block kinds", () => {
    expect(shape.root).toBe(enums.block);
  });

  it("reads an explicit root content model", () => {
    const narrow = {
      kinds: contract.kinds,
      root: ["paragraph"],
      axes: {},
      order: [],
    } as const;
    expect([...defineShape(narrow, defineEnum(narrow)).root]).toEqual([
      "paragraph",
    ]);
    const none = {
      kinds: contract.kinds,
      root: "none",
      axes: {},
      order: [],
    } as const;
    expect(defineShape(none, defineEnum(none)).root.size).toBe(0);
  });
});
