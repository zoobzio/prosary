import { describe, expect, it } from "vitest";

import { defineEnum } from "../src/enum";
import { fits, isDirectiveMatch, kindOf } from "../src/match";
import { contract } from "./fixture";

const enums = defineEnum(contract);

describe("isDirectiveMatch", () => {
  it("tells a directive match from a type match", () => {
    expect(isDirectiveMatch({ directive: "x" })).toBe(true);
    expect(isDirectiveMatch({ type: "x" })).toBe(false);
  });
});

describe("fits", () => {
  it("compares each field by deep equality", () => {
    expect(fits({ depth: 1 }, { depth: 1 })).toBe(true);
    expect(fits({ depth: 2 }, { depth: 1 })).toBe(false);
    expect(fits({ depth: 1, lang: "ts" }, { depth: 1, lang: "ts" })).toBe(true);
    expect(fits({ depth: 1 }, { depth: 1, lang: "ts" })).toBe(false);
    expect(fits({ meta: { a: 1 } }, { meta: { a: 1 } })).toBe(true);
  });

  it("accepts any member of an array value", () => {
    expect(fits({ depth: 2 }, { depth: [1, 2] })).toBe(true);
    expect(fits({ depth: 3 }, { depth: [1, 2] })).toBe(false);
  });

  it("accepts an empty where", () => {
    expect(fits({ depth: 1 }, {})).toBe(true);
  });
});

describe("kindOf", () => {
  it("matches a standard node by type", () => {
    expect(kindOf({ type: "paragraph" }, contract, enums)).toBe("paragraph");
    expect(kindOf({ type: "text", value: "x" }, contract, enums)).toBe("text");
  });

  it("prefers the kind whose where fits, then the kind with no where", () => {
    expect(kindOf({ type: "heading", depth: 1 }, contract, enums)).toBe(
      "title",
    );
    expect(kindOf({ type: "heading", depth: 2 }, contract, enums)).toBe(
      "heading",
    );
  });

  it("prefers the where with the most keys", () => {
    const narrow = {
      kinds: {
        wide: {
          match: { type: "code", where: { lang: "ts" } },
          level: "block",
          content: "none",
        },
        exact: {
          match: { type: "code", where: { lang: "ts", meta: "run" } },
          level: "block",
          content: "none",
        },
      },
      axes: {},
      order: [],
    } as const;
    const narrowEnums = defineEnum(narrow);
    expect(
      kindOf({ type: "code", lang: "ts", meta: "run" }, narrow, narrowEnums),
    ).toBe("exact");
    expect(kindOf({ type: "code", lang: "ts" }, narrow, narrowEnums)).toBe(
      "wide",
    );
    expect(
      kindOf({ type: "code", lang: "js" }, narrow, narrowEnums),
    ).toBeUndefined();
  });

  it("matches a directive by name across the three directive types", () => {
    expect(
      kindOf({ type: "containerDirective", name: "callout" }, contract, enums),
    ).toBe("callout");
    expect(
      kindOf({ type: "leafDirective", name: "rule" }, contract, enums),
    ).toBe("rule");
    expect(
      kindOf({ type: "textDirective", name: "badge" }, contract, enums),
    ).toBe("badge");
  });

  it("returns undefined for an unknown type, name, or a missing name", () => {
    expect(kindOf({ type: "thematicBreak" }, contract, enums)).toBeUndefined();
    expect(
      kindOf({ type: "leafDirective", name: "nope" }, contract, enums),
    ).toBeUndefined();
    expect(kindOf({ type: "leafDirective" }, contract, enums)).toBeUndefined();
    expect(kindOf({ type: 1 }, contract, enums)).toBeUndefined();
  });
});
