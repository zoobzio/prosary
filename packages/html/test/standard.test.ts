import { describe, expect, it } from "vitest";

import { element, standard, text } from "../src/standard";
import { schema } from "./fixture";

const piece = { children: [], classes: ["x"], data: {} };

describe("element and text", () => {
  it("make hast nodes", () => {
    expect(text("a")).toEqual({ type: "text", value: "a" });
    expect(
      element(
        "p",
        { classes: ["a"], data: { dataKind: "note" } },
        [text("x")],
        { id: "i" },
      ),
    ).toEqual({
      type: "element",
      tagName: "p",
      properties: { className: ["a"], dataKind: "note", id: "i" },
      children: [{ type: "text", value: "x" }],
    });
  });
});

describe("standard", () => {
  it("renders a heading at its depth, clamped to six", () => {
    const handler = standard(schema, "heading");
    expect(
      handler?.(
        {
          type: "heading",
          depth: 3,
          data: { kind: "heading", id: "x", attributes: { depth: 3 } },
        },
        { ...piece, className: "x", role: () => "r" },
      ),
    ).toMatchObject({ tagName: "h3" });
    expect(
      handler?.(
        {
          type: "heading",
          depth: 9,
          data: { kind: "heading", id: "x", attributes: { depth: 9 } },
        },
        { ...piece, className: "x", role: () => "r" },
      ),
    ).toMatchObject({ tagName: "h6" });
    expect(
      handler?.(
        {
          type: "heading",
          data: { kind: "heading", id: "x", attributes: { depth: 1 } },
        },
        { ...piece, className: "x", role: () => "r" },
      ),
    ).toMatchObject({ tagName: "h1" });
  });

  it("renders an ordered list start and a task item", () => {
    const list = standard(schema, "list");
    expect(
      list?.(
        {
          type: "list",
          ordered: true,
          start: 3,
          data: { kind: "list", id: "x", attributes: {} },
        },
        { ...piece, className: "x", role: () => "r" },
      ),
    ).toMatchObject({ tagName: "ol", properties: { start: 3 } });
    expect(
      list?.(
        {
          type: "list",
          ordered: true,
          start: 1,
          data: { kind: "list", id: "x", attributes: {} },
        },
        { ...piece, className: "x", role: () => "r" },
      ),
    ).toMatchObject({ properties: { className: ["x"] } });
    const item = standard(schema, "listItem");
    expect(
      item?.(
        {
          type: "listItem",
          checked: true,
          data: { kind: "listItem", id: "x", attributes: {} },
        },
        { ...piece, className: "x", role: () => "r" },
      ),
    ).toMatchObject({ properties: { dataChecked: "true" } });
  });

  it("renders a link without a title and an image without one", () => {
    const link = standard(schema, "link");
    expect(
      link?.(
        {
          type: "link",
          url: "https://x",
          data: { kind: "link", id: "x", attributes: { url: "https://x" } },
        },
        { ...piece, className: "x", role: () => "r" },
      ),
    ).toMatchObject({ properties: { href: "https://x" } });
    const image = standard(schema, "image");
    expect(
      image?.(
        {
          type: "image",
          url: "https://x",
          data: { kind: "image", id: "x", attributes: {} },
        },
        { ...piece, className: "x", role: () => "r" },
      ),
    ).toMatchObject({ properties: { src: "https://x", alt: "" } });
  });

  it("renders a code block without a language and a table without rows", () => {
    const code = standard(schema, "code");
    expect(
      code?.(
        {
          type: "code",
          value: "x",
          data: { kind: "code", id: "x", attributes: {} },
        },
        { ...piece, className: "x", role: () => "r" },
      ),
    ).toMatchObject({
      tagName: "pre",
      children: [{ tagName: "code", properties: {} }],
    });
    const table = standard(schema, "table");
    expect(
      table?.(
        { type: "table", data: { kind: "table", id: "x", attributes: {} } },
        { ...piece, className: "x", role: () => "r" },
      ),
    ).toMatchObject({ tagName: "table", children: [] });
  });

  it("falls back by level for a directive of an unknown node type", () => {
    const rule = standard(schema, "rule");
    expect(
      rule?.(
        { type: "mystery", data: { kind: "rule", id: "x", attributes: {} } },
        { ...piece, className: "x", role: () => "r" },
      ),
    ).toMatchObject({ tagName: "div" });
    const badge = standard(schema, "badge");
    expect(
      badge?.(
        {
          type: "mystery",
          data: { kind: "badge", id: "x", attributes: { tone: "info" } },
        },
        { ...piece, className: "x", role: () => "r" },
      ),
    ).toMatchObject({ tagName: "span" });
  });

  it("returns undefined for a type with no standard handler", async () => {
    const odd = schema.meta.enums.kinds.has("footnote" as never);
    expect(odd).toBe(false);
    const oddSchema = (await import("@prosary/schema")).defineContract({
      kinds: {
        f: {
          match: { type: "footnoteDefinition" },
          level: "block",
          content: "block",
        },
      },
    });
    expect(standard(oddSchema, "f")).toBeUndefined();
  });
});
