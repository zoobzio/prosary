import { describe, expect, it } from "vitest";

import { defineAssert } from "../src/assert";
import { SchemaError } from "../src/error";
import { defineParse } from "../src/parse";
import { contract, meta, paragraph, text, tree } from "./fixture";

const parse = defineParse(defineAssert(meta), meta);

describe("defineParse", () => {
  it("returns the same value for the scalar and overlay kinds", () => {
    expect(parse.contract(contract)).toBe(contract);
    expect(parse.kind("callout")).toBe("callout");
    expect(parse.axis("locale")).toBe("locale");
    const input = { locale: "fr", platform: "mac" };
    expect(parse.input(input)).toBe(input);
    expect(parse.reference("#x")).toBe("#x");
    const layer = { id: "l", name: "L" };
    expect(parse.override({})).toEqual({});
    expect(parse.patch({})).toEqual({});
    expect(parse.layer(layer)).toBe(layer);
  });

  it("returns the bound tree for node and document", () => {
    const node = parse.node(paragraph(text("x")));
    expect(node.data.kind).toBe("paragraph");
    expect(node.data.id).toBe("paragraph[0]");
    const document = parse.document(tree);
    expect(document.data.id).toBe("");
    expect(document.children[0]?.data.kind).toBe("title");
  });

  it("throws a SchemaError for an invalid value", () => {
    expect(() => parse.kind("ghost")).toThrow(SchemaError);
    expect(() => parse.node({ type: "html", value: "x" })).toThrow(SchemaError);
    expect(() => parse.document(null)).toThrow(SchemaError);
  });
});
