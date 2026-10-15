import { definePipeline } from "../src/pipeline";
import { describe, expect, it } from "vitest";

import { matter } from "../src/plugins/matter";

const source = "---\ntitle: Guide\ntags: [a, b]\n---\n\n# Guide\n";
const pipeline = definePipeline({ presets: [matter()] });

describe("matter", () => {
  it("moves the frontmatter from the Markdown tree to its root data", () => {
    const tree = pipeline.parse(source);
    expect(tree.children.map((node) => node.type)).toEqual(["heading"]);
    expect(tree.data?.matter).toEqual({ title: "Guide", tags: ["a", "b"] });
  });

  it("carries it onto the HTML root", () => {
    const tree = pipeline.build(source);
    expect(tree.children.map((node) => node.type)).toEqual(["element"]);
    expect(tree.data?.matter).toEqual({ title: "Guide", tags: ["a", "b"] });
  });

  it("leaves a document without frontmatter alone", () => {
    expect(pipeline.build("# Guide\n").data).toBeUndefined();
  });

  it("fails the file at a block that is not a map or does not parse", () => {
    expect(() => pipeline.parse("---\n- a\n---\n\n# Hi\n")).toThrow(
      expect.objectContaining({
        reason: "Frontmatter must be a YAML map.",
        line: 1,
        column: 1,
      }),
    );
    expect(() => pipeline.parse("---\nid: [\n---\n")).toThrow(
      expect.objectContaining({
        reason: expect.stringMatching(/^Frontmatter is not valid YAML: /),
        line: 1,
      }),
    );
  });

  it("is off without the preset", () => {
    const tree = definePipeline().parse(source);
    expect(tree.children[0]?.type).toBe("thematicBreak");
    expect(tree.data).toBeUndefined();
  });
});
