import { describe, expect, expectTypeOf, it } from "vitest";

import { SchemaError } from "../src/error";
import { defineContract } from "../src/schema";
import type { Attributes, Document, Kind, Node, Role } from "../src/types";
import { contract, tree } from "./fixture";

const schema = defineContract(contract);

describe("defineContract", () => {
  it("returns the base, meta, bind, and validator families", () => {
    expect(Object.keys(schema).sort()).toEqual([
      "assert",
      "base",
      "bind",
      "check",
      "inspect",
      "meta",
      "parse",
    ]);
  });

  it("keeps the source contract as base", () => {
    expect(schema.base).toBe(contract);
  });

  it("exposes the document bind", () => {
    expect(schema.bind).toBe(schema.meta.bind.document);
    const result = schema.bind(tree, { id: "guide" });
    expect(result.success).toBe(true);
  });

  it("wires check, assert, parse, and inspect off the same contract", () => {
    expect(schema.check.document(tree)).toBe(true);
    expect(() => schema.assert.kind("callout")).not.toThrow();
    expect(schema.parse.kind("callout")).toBe("callout");
    expect(schema.inspect.reference("nope").success).toBe(false);
  });

  it("validates the contract at construction", () => {
    expect(() =>
      defineContract({
        kinds: {
          a: { match: { directive: "x" }, level: "block", content: "none" },
          b: { match: { directive: "x" }, level: "block", content: "none" },
        },
      }),
    ).toThrow(SchemaError);
  });

  it("constructs cleanly for a minimal contract", () => {
    expect(() => defineContract({ kinds: {} })).not.toThrow();
  });
});

describe("types", () => {
  type C = typeof contract;

  it("narrows the names from the contract", () => {
    expectTypeOf<Kind<C>>().toEqualTypeOf<
      | "text"
      | "emphasis"
      | "link"
      | "badge"
      | "title"
      | "heading"
      | "paragraph"
      | "code"
      | "blockquote"
      | "callout"
      | "rule"
    >();
    expectTypeOf<Role<C, "callout">>().toEqualTypeOf<
      "border" | "marker" | "text"
    >();
    expectTypeOf<Role<C, "text">>().toEqualTypeOf<never>();
  });

  it("types the attributes with required and optional members", () => {
    type Callout = Attributes<C, "callout">;
    expectTypeOf<keyof Callout>().toEqualTypeOf<
      "kind" | "draft" | "weight" | "accent"
    >();
    expectTypeOf<Callout["kind"]>().toEqualTypeOf<"note" | "warning">();
    expectTypeOf<Callout["draft"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<Callout["weight"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<Callout["accent"]>().toEqualTypeOf<
      `{${string}}` | undefined
    >();
    expectTypeOf<{ kind: "note" }>().toMatchTypeOf<Callout>();
    expectTypeOf<{ draft: true }>().not.toMatchTypeOf<Callout>();
    type Link = Attributes<C, "link">;
    expectTypeOf<Link["url"]>().toEqualTypeOf<string>();
    expectTypeOf<Link["title"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<keyof Attributes<C, "paragraph">>().toEqualTypeOf<never>();
  });

  it("narrows a parsed document and node", () => {
    const document = schema.parse.document(tree);
    expectTypeOf(document).toEqualTypeOf<Document<C>>();
    const node = schema.parse.node({ type: "paragraph", children: [] });
    expectTypeOf(node).toEqualTypeOf<Node<C>>();
    const callout = node as Node<C, "callout">;
    expectTypeOf(callout.data.attributes.kind).toEqualTypeOf<
      "note" | "warning"
    >();
    expectTypeOf(callout.data.kind).toEqualTypeOf<"callout">();
  });
});
