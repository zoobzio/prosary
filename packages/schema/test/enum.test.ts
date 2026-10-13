import { describe, expect, it } from "vitest";

import { defineEnum } from "../src/enum";
import { contract } from "./fixture";

const enums = defineEnum(contract);

describe("defineEnum", () => {
  it("reads the kind names and their levels", () => {
    expect(enums.kinds.has("callout")).toBe(true);
    expect([...enums.inline]).toEqual(["text", "emphasis", "link", "badge"]);
    expect(enums.block.has("paragraph")).toBe(true);
    expect(enums.block.has("text")).toBe(false);
  });

  it("indexes the standard kinds by mdast type in declaration order", () => {
    expect(enums.types.get("heading")).toEqual(["title", "heading"]);
    expect(enums.types.get("paragraph")).toEqual(["paragraph"]);
    expect(enums.types.has("callout")).toBe(false);
  });

  it("indexes the directive kinds by name", () => {
    expect(enums.directives.get("callout")).toBe("callout");
    expect(enums.directives.get("badge")).toBe("badge");
    expect(enums.directives.has("heading")).toBe(false);
  });

  it("reads the axes, contexts, and defaults", () => {
    expect([...enums.axes]).toEqual(["locale", "platform"]);
    expect([...enums.contexts.locale]).toEqual(["en", "fr"]);
    expect(enums.defaults.platform).toBe("mac");
  });

  it("holds the specification sets", () => {
    expect(enums.levels.has("block")).toBe(true);
    expect(enums.models.has("inline")).toBe(true);
    expect(enums.attributeTypes.has("url")).toBe(true);
    expect(enums.directiveTypes.has("leafDirective")).toBe(true);
    expect([...enums.layerKeys]).toEqual(["id", "name"]);
  });

  it("works for a contract with no axes", () => {
    const bare = defineEnum({ kinds: {}, axes: {}, order: [] });
    expect(bare.axes.size).toBe(0);
    expect(bare.kinds.size).toBe(0);
  });
});
