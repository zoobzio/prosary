import type { Nodes } from "hast";

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

  it("keeps a colon inside a word as text", () => {
    const build = (source: string) => pipeline.build(source).children[0];
    expect(build("Meet at 10:30 sharp.")).toMatchObject({
      tagName: "p",
      children: [{ type: "text", value: "Meet at 10:30 sharp." }],
    });
    expect(build("See John 3:16 and Genesis 1:1.")).toMatchObject({
      children: [{ type: "text", value: "See John 3:16 and Genesis 1:1." }],
    });
    expect(build("Set key:value on localhost:3000.")).toMatchObject({
      children: [{ type: "text", value: "Set key:value on localhost:3000." }],
    });
    expect(build("Prix 10:30h et clé:valeur.")).toMatchObject({
      children: [{ type: "text", value: "Prix 10:30h et clé:valeur." }],
    });
    expect(build("(Col. 3:17) at 09:45:12")).toMatchObject({
      children: [{ type: "text", value: "(Col. 3:17) at 09:45:12" }],
    });
    expect(build("Use the vue:transition hook.")).toMatchObject({
      children: [{ type: "text", value: "Use the vue:transition hook." }],
    });
  });

  it("keeps a name that starts with a digit as text", () => {
    expect(pipeline.build("Rate 10 :30 wide").children[0]).toMatchObject({
      children: [{ type: "text", value: "Rate 10 :30 wide" }],
    });
  });

  it("restores the label and attributes of a directive that is text", () => {
    expect(pipeline.build("a key:value[x]{y=1} b").children[0]).toMatchObject({
      children: [{ type: "text", value: "a key:value[x]{y=1} b" }],
    });
  });

  it("reads an inline directive at the start of a word", () => {
    const tree = pipeline.build(":a[1] (:b[2]) [:c[3]] *:d[4]* _:e[5]_\n");
    const names = (node: Nodes): string[] =>
      node.type === "element" && node.properties.dataDirective !== undefined
        ? [String(node.properties.dataDirective)]
        : "children" in node
          ? node.children.flatMap(names)
          : [];
    expect(names(tree)).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("restores a directive that is text inside a label", () => {
    expect(pipeline.build("Note :x[at 10:30]").children[0]).toMatchObject({
      children: [
        { value: "Note " },
        {
          tagName: "span",
          properties: { dataDirective: "x" },
          children: [{ value: "at 10:30" }],
        },
      ],
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
