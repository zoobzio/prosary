import { definePipeline } from "../src/pipeline";
import { describe, expect, it } from "vitest";

import { gfm } from "../src/plugins/gfm";

const source = "| a | b |\n| - | - |\n| 1 | 2 |\n\n~~gone~~ https://x.io\n";

describe("gfm", () => {
  it("parses the GFM extensions", () => {
    const tree = definePipeline({ presets: [gfm()] }).parse(source);
    expect(tree.children[0]?.type).toBe("table");
    const paragraph = tree.children[1];
    expect(
      paragraph?.type === "paragraph" &&
        paragraph.children.map((node) => node.type),
    ).toEqual(["delete", "text", "link"]);
  });

  it("builds them as elements", () => {
    const tree = definePipeline({ presets: [gfm()] }).build(source);
    expect(tree.children[0]).toMatchObject({ tagName: "table" });
  });

  it("passes its options to remark-gfm", () => {
    const tree = definePipeline({
      presets: [gfm({ singleTilde: false })],
    }).parse("~one~ ~~two~~\n");
    const paragraph = tree.children[0];
    expect(
      paragraph?.type === "paragraph" &&
        paragraph.children.map((node) => node.type),
    ).toEqual(["text", "delete"]);
  });

  it("is off without the preset", () => {
    expect(definePipeline().parse(source).children[0]?.type).toBe("paragraph");
  });
});
