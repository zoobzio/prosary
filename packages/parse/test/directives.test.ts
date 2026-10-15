import { definePipeline } from "../src/pipeline";
import { describe, expect, it } from "vitest";

import { directives } from "../src/plugins/directives";

const pipeline = definePipeline({ presets: [directives()] });

describe("directives", () => {
  it("builds a container as a marked div carrying its attributes", () => {
    const tree = pipeline.build(
      ':::callout{kind="warning" draft #note .box data-x=1}\nCareful.\n:::\n',
    );
    expect(tree.children[0]).toMatchObject({
      tagName: "div",
      properties: {
        dataDirective: "callout",
        dataKind: "warning",
        dataDraft: "",
        id: "note",
        className: ["box"],
        dataDataX: "1",
      },
      children: [{ tagName: "p" }],
    });
  });

  it("builds a leaf as a marked div and an inline directive as a marked span", () => {
    const tree = pipeline.build("::rule\n\nNew :badge[beta]{tone=info}.\n");
    expect(tree.children[0]).toMatchObject({
      tagName: "div",
      properties: { dataDirective: "rule" },
      children: [],
    });
    expect(tree.children[2]).toMatchObject({
      tagName: "p",
      children: [
        { value: "New " },
        {
          tagName: "span",
          properties: { dataDirective: "badge", dataTone: "info" },
          children: [{ value: "beta" }],
        },
        { value: "." },
      ],
    });
  });

  it("keeps the directive nodes in the Markdown tree", () => {
    const tree = pipeline.parse(":::callout\nHi\n:::\n");
    expect(tree.children[0]).toMatchObject({
      type: "containerDirective",
      name: "callout",
    });
  });

  it("is off without the preset", () => {
    const tree = definePipeline().build("::rule\n");
    expect(tree.children[0]).toMatchObject({
      tagName: "p",
      children: [{ value: "::rule" }],
    });
  });
});
