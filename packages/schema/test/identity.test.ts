import { describe, expect, it } from "vitest";

import { explicit, identify, slug, structural, textOf } from "../src/identity";

describe("textOf", () => {
  it("concatenates the values of the descendants", () => {
    expect(
      textOf({
        type: "heading",
        children: [
          { type: "text", value: "A " },
          { type: "emphasis", children: [{ type: "text", value: "b" }] },
        ],
      }),
    ).toBe("A b");
    expect(textOf({ type: "text", value: "x" })).toBe("x");
    expect(textOf({ type: "thematicBreak" })).toBe("");
    expect(textOf(null)).toBe("");
  });
});

describe("slug", () => {
  it("lower-cases, trims, strips punctuation, and dashes spaces", () => {
    expect(slug("  Setup Guide! ")).toBe("setup-guide");
    expect(slug("C'est déjà_fait")).toBe("cest-déjà_fait");
    expect(slug("Keep-dash 2")).toBe("keep-dash-2");
    expect(slug("!!!")).toBe("");
  });
});

describe("explicit", () => {
  it("reads data.id first, then the directive id attribute", () => {
    expect(explicit({ data: { id: "a" }, attributes: { id: "b" } })).toBe("a");
    expect(explicit({ attributes: { id: "b" } })).toBe("b");
    expect(
      explicit({ data: { id: "" }, attributes: { id: "" } }),
    ).toBeUndefined();
    expect(explicit({ data: { id: 1 } })).toBeUndefined();
    expect(explicit({})).toBeUndefined();
    expect(explicit("x")).toBeUndefined();
  });
});

describe("structural", () => {
  it("joins the parent, the kind, and the ordinal", () => {
    expect(structural("", "paragraph", 0)).toBe("paragraph[0]");
    expect(structural("intro", "paragraph", 2)).toBe("intro/paragraph[2]");
  });
});

describe("identify", () => {
  it("takes the first rule that applies", () => {
    expect(
      identify(
        {
          type: "heading",
          data: { id: "given" },
          children: [{ type: "text", value: "Hi" }],
        },
        "heading",
        "",
        0,
      ),
    ).toBe("given");
    expect(
      identify(
        { type: "heading", children: [{ type: "text", value: "Hi There" }] },
        "heading",
        "",
        0,
      ),
    ).toBe("hi-there");
    expect(
      identify(
        { type: "heading", children: [{ type: "text", value: "!!!" }] },
        "heading",
        "",
        1,
      ),
    ).toBe("heading[1]");
    expect(
      identify(
        { type: "paragraph", children: [{ type: "text", value: "Hi" }] },
        "paragraph",
        "intro",
        0,
      ),
    ).toBe("intro/paragraph[0]");
  });
});
