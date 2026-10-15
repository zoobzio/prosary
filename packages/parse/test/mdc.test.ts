import { definePipeline } from "../src/pipeline";
import { describe, expect, it } from "vitest";

import { mdc } from "../src/plugins/mdc";

const pipeline = definePipeline({ presets: [mdc()] });

describe("mdc", () => {
  it("builds a block as a marked div carrying its attributes", () => {
    const tree = pipeline.build(
      '::callout{kind="warning" draft #note .box data-x=1}\nCareful.\n::\n',
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

  it("builds an inline component as a marked span", () => {
    const tree = pipeline.build("New :badge[beta]{tone=info}.\n");
    expect(tree.children[0]).toMatchObject({
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

  it("builds an inline component alone on a line as a div", () => {
    const tree = pipeline.build("Para\n\n:rule{x=1}\n\nPara\n");
    expect(tree.children[2]).toMatchObject({
      tagName: "div",
      properties: { dataDirective: "rule", dataX: "1" },
      children: [],
    });
  });

  it("builds a nested block and a slot", () => {
    const tree = pipeline.build(
      "::hero\nDefault\n\n#aside{.narrow}\n  :::card\n  Inner\n  :::\n::\n",
    );
    expect(tree.children[0]).toMatchObject({
      tagName: "div",
      properties: { dataDirective: "hero" },
      children: [
        { tagName: "p", children: [{ value: "Default" }] },
        {
          tagName: "div",
          properties: { dataSlot: "aside", className: ["narrow"] },
          children: [
            {
              tagName: "div",
              properties: { dataDirective: "card" },
              children: [{ tagName: "p", children: [{ value: "Inner" }] }],
            },
          ],
        },
      ],
    });
  });

  it("takes props from a YAML block as data attributes", () => {
    const tree = pipeline.build(
      "::card\n---\ntitle: Hi\ncount: 2\ntags: [a, b]\n---\nBody\n::\n",
    );
    expect(tree.children[0]).toMatchObject({
      properties: {
        dataDirective: "card",
        dataTitle: "Hi",
        dataCount: "2",
        dataTags: '["a","b"]',
      },
    });
  });

  it("builds a span as a plain span and sets attributes on an element", () => {
    const tree = pipeline.build(
      'Hi [World]{.blue} and [sic] and **bold**{#b style="color: red"}.\n',
    );
    expect(tree.children[0]).toMatchObject({
      children: [
        { value: "Hi " },
        {
          tagName: "span",
          properties: { className: ["blue"] },
          children: [{ value: "World" }],
        },
        { value: " and " },
        { tagName: "span", properties: {}, children: [{ value: "sic" }] },
        { value: " and " },
        { tagName: "strong", properties: { id: "b", style: "color: red" } },
        { value: "." },
      ],
    });
  });

  it("builds a binding as a marked span", () => {
    const tree = pipeline.build("Total {{ $total }}.\n");
    expect(tree.children[0]).toMatchObject({
      children: [
        { value: "Total " },
        {
          tagName: "span",
          properties: { dataDirective: "binding", dataValue: "$total" },
        },
        { value: "." },
      ],
    });
  });

  it("keeps a colon inside a word as text", () => {
    expect(
      pipeline.build("Meet at 10:30, see John 3:16, key:value.").children[0],
    ).toMatchObject({
      children: [
        { type: "text", value: "Meet at 10:30, see John 3:16, key:value." },
      ],
    });
  });

  it("keeps the component nodes in the Markdown tree", () => {
    const tree = pipeline.parse("::callout\nHi\n::\n");
    expect(tree.children[0]).toMatchObject({
      type: "containerComponent",
      name: "callout",
    });
  });

  it("is off without the preset", () => {
    const tree = definePipeline().build(":rule\n");
    expect(tree.children[0]).toMatchObject({
      tagName: "p",
      children: [{ value: ":rule" }],
    });
  });
});
