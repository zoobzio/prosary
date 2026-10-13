import { describe, expect, it } from "vitest";

import { index, replace, visit } from "../src/tree";
import { meta, tree } from "./fixture";

const bound = meta.bind.document(tree, { id: "guide" });
const document = bound.success ? bound.data : undefined;

describe("visit", () => {
  it("calls the function for each node, parents before children", () => {
    if (!document) {
      return;
    }
    const seen: string[] = [];
    visit(document, (node) => {
      seen.push(node.data.id);
    });
    expect(seen.slice(0, 4)).toEqual([
      "setup-guide",
      "setup-guide/text[0]",
      "install",
      "install/text[0]",
    ]);
    expect(seen).toContain("blockquote[0]/paragraph[0]/text[0]");
  });
});

describe("index", () => {
  it("maps each node id to its node", () => {
    if (!document) {
      return;
    }
    const nodes = index(document);
    expect(nodes.get("install")?.data.kind).toBe("heading");
    expect(nodes.get("callout[0]")?.data.attributes).toEqual({
      kind: "warning",
      draft: true,
      weight: 3,
    });
    expect(nodes.has("ghost")).toBe(false);
  });
});

describe("replace", () => {
  it("returns a copy with one node replaced and shares the rest", () => {
    if (!document) {
      return;
    }
    const next = replace(document, "callout[0]", (node) => ({
      ...node,
      data: { ...node.data, attributes: { kind: "note" } },
    }));
    expect(next).not.toBe(document);
    expect(next.children[3]?.data.attributes).toEqual({ kind: "note" });
    expect(next.children[0]).toBe(document.children[0]);
    expect(document.children[3]?.data.attributes).toEqual({
      kind: "warning",
      draft: true,
      weight: 3,
    });
  });

  it("replaces a nested node", () => {
    if (!document) {
      return;
    }
    const next = replace(document, "blockquote[0]/paragraph[0]", (node) => ({
      ...node,
      children: [],
    }));
    expect(next.children[5]?.children?.[0]?.children).toEqual([]);
    expect(next.children[5]).not.toBe(document.children[5]);
    expect(next.children[4]).toBe(document.children[4]);
  });

  it("returns the same tree when no node has the id", () => {
    if (!document) {
      return;
    }
    expect(replace(document, "ghost", (node) => node)).toBe(document);
  });
});
