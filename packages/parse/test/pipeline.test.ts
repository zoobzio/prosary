import type { Root as Hast } from "hast";
import type { Root as Mdast } from "mdast";
import type { Plugin } from "unified";

import { describe, expect, it } from "vitest";

import { definePipeline } from "../src/pipeline";

const source = `# Title

Some *text* and <b>html</b>.

\`\`\`ts
let x = 1;
\`\`\`
`;

describe("definePipeline", () => {
  it("parses CommonMark into a Markdown tree with positions", () => {
    const tree = definePipeline().parse(source);
    expect(tree.type).toBe("root");
    expect(tree.children.map((node) => node.type)).toEqual([
      "heading",
      "paragraph",
      "code",
    ]);
    expect(tree.children[2]?.position?.start.line).toBe(5);
  });

  it("builds the HTML tree, raw HTML left out", () => {
    const tree = definePipeline().build(source);
    expect(tree.type).toBe("root");
    const elements = tree.children.filter((node) => node.type === "element");
    expect(elements.map((node) => node.tagName)).toEqual(["h1", "p", "pre"]);
    expect(JSON.stringify(tree)).not.toContain("<b>");
  });

  it("reads only CommonMark without presets", () => {
    const tree = definePipeline().parse("---\na: 1\n---\n\n| a |\n| - |\n");
    expect(tree.children.map((node) => node.type)).toEqual([
      "thematicBreak",
      "heading",
      "paragraph",
    ]);
  });

  it("runs each preset's plugins on its side, in order", () => {
    const seen: string[] = [];
    const remark =
      (name: string): Plugin<[], Mdast> =>
      () =>
      (tree) => {
        seen.push(`${name}:${tree.children[0]?.type}`);
      };
    const rehype =
      (name: string): Plugin<[], Hast> =>
      () =>
      (tree) => {
        seen.push(`${name}:${tree.children[0]?.type}`);
      };
    const pipeline = definePipeline({
      presets: [
        { remark: [remark("a")], rehype: [rehype("c")] },
        { remark: [remark("b")], rehype: [rehype("d")] },
      ],
    });
    pipeline.parse("# Hi\n");
    expect(seen).toEqual(["a:heading", "b:heading"]);
    seen.length = 0;
    pipeline.build("# Hi\n");
    expect(seen).toEqual(["a:heading", "b:heading", "c:element", "d:element"]);
  });

  it("takes a plugin with its options", () => {
    const tag: Plugin<[{ suffix: string }], Hast> =
      ({ suffix }) =>
      (tree) => {
        const [first] = tree.children;
        if (first?.type === "element") {
          first.tagName = `${first.tagName}${suffix}`;
        }
      };
    const tree = definePipeline({
      presets: [{ rehype: [[tag, { suffix: "x" }]] }],
    }).build("# Hi\n");
    expect(tree.children[0]).toMatchObject({ tagName: "h1x" });
  });

  it("throws what a plugin fails the file with, placed", () => {
    const fail: Plugin<[], Mdast> = () => (tree, file) => {
      file.fail("No headings.", tree.children[0]);
    };
    expect(() =>
      definePipeline({ presets: [{ remark: [fail] }] }).parse("\n# Hi\n"),
    ).toThrow(
      expect.objectContaining({ reason: "No headings.", line: 2, column: 1 }),
    );
  });
});
