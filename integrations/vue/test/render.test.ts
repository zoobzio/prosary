import type { Root } from "hast";

import { describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import { ProsaryDocument } from "../src/document";
import { render } from "../src/render";

const tree: Root = {
  type: "root",
  data: { matter: { title: "Guide" } },
  children: [
    {
      type: "element",
      tagName: "h2",
      properties: { id: "install", className: ["lead", "big"] },
      children: [{ type: "text", value: "Install" }],
    },
    { type: "text", value: "\n" },
    {
      type: "element",
      tagName: "div",
      properties: {
        dataDirective: "callout",
        dataKind: "warning",
        dataDraft: "",
      },
      children: [
        {
          type: "element",
          tagName: "p",
          properties: {},
          children: [{ type: "text", value: "Careful." }],
        },
      ],
    },
    { type: "comment", value: "hidden" },
    {
      type: "element",
      tagName: "a",
      properties: { href: "/x", ariaLabel: "x", accept: ["a", "b"] },
      children: [{ type: "text", value: "x" }],
    },
  ],
};

const html = (components = {}) =>
  renderToString(h(ProsaryDocument, { tree, components }));

describe("render", () => {
  it("renders elements as their tags with HTML attribute names, comments left out", async () => {
    expect(await html()).toBe(
      "<!--[-->" +
        '<h2 id="install" class="lead big">Install</h2>\n' +
        '<div data-directive="callout" data-kind="warning" data-draft>' +
        "<p>Careful.</p></div>" +
        '<a href="/x" aria-label="x" accept="a, b">x</a>' +
        "<!--]-->",
    );
  });

  it("renders a component in place of a tag, with the attributes as props and the children in its slot", async () => {
    const Heading = defineComponent({
      props: { id: String, class: String },
      setup:
        (props, { slots }) =>
        () =>
          h(
            "h3",
            { "data-id": props.id, class: props.class },
            slots.default?.(),
          ),
    });
    expect(await html({ h2: Heading })).toContain(
      '<h3 data-id="install" class="lead big">Install</h3>',
    );
  });

  it("renders a component in place of a directive, with its attributes by their written names", async () => {
    const Callout = defineComponent({
      props: { kind: String, draft: String },
      setup:
        (props, { slots }) =>
        () =>
          h(
            "aside",
            { class: `callout-${props.kind}`, draft: props.draft },
            slots.default?.(),
          ),
    });
    expect(await html({ callout: Callout, div: Callout })).toContain(
      '<aside class="callout-warning" draft><p>Careful.</p></aside>',
    );
    expect(await html({ callout: Callout, div: Callout })).not.toContain(
      "data-directive",
    );
  });

  it("prefers a directive's component over its tag's", async () => {
    const ByTag = defineComponent({ setup: () => () => h("i", "tag") });
    const ByName = defineComponent({ setup: () => () => h("b", "name") });
    expect(await html({ div: ByTag, callout: ByName })).toContain(">name</b>");
    expect(await html({ div: ByTag })).toContain(">tag</i>");
  });

  it("returns a vnode child per root child, comments left out", () => {
    const children = render(tree);
    expect(children).toHaveLength(4);
    expect(children[1]).toBe("\n");
  });
});
