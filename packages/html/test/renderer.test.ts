import { describe, expect, it } from "vitest";

import { UncoveredKindError } from "../src/error";
import { defineRenderer } from "../src/renderer";
import { defineStyle } from "../src/style";
import { callout, contract, document, schema, store, style } from "./fixture";

const styled = defineStyle(schema, style);
const renderer = defineRenderer(store(), styled, { callout });
const html = renderer.html("guide");

describe("defineRenderer", () => {
  it("renders the standard kinds to semantic HTML with kind and role classes", () => {
    expect(html).toContain(
      '<h1 class="p-heading p-heading-text">Setup Guide</h1>',
    );
    expect(html).toContain('<p class="p-paragraph p-paragraph-text">');
    expect(html).toContain('<em class="p-emphasis p-emphasis-text">note</em>');
    expect(html).toContain('<strong class="p-strong">this</strong>');
    expect(html).toContain('<del class="p-delete">gone</del>');
    expect(html).toContain('<code class="p-inlineCode">code</code>');
    expect(html).toContain(
      '<a class="p-link p-link-text" href="doc:intro#start">intro</a>',
    );
    expect(html).toContain(
      '<blockquote class="p-blockquote p-blockquote-border prose-quote">',
    );
    expect(html).toContain('<ul class="p-list">');
    expect(html).toContain('<ol class="p-list">');
    expect(html).toContain('<li class="p-listItem">');
    expect(html).toContain('<hr class="p-thematicBreak">');
    expect(html).toContain(
      '<pre class="p-code p-code-surface"><code class="language-ts">let x = 1;</code></pre>',
    );
    expect(html).toContain(
      '<img class="p-image" src="https://example.com/a.png" alt="Alt text" title="Title">',
    );
  });

  it("renders a table with a head row", () => {
    expect(html).toContain(
      '<table class="p-table"><thead><tr class="p-tableRow"><th class="p-tableCell">Name</th>',
    );
    expect(html).toContain(
      '<tbody><tr class="p-tableRow"><td class="p-tableCell">a</td>',
    );
  });

  it("escapes text content", () => {
    expect(html).toContain("Quoted a &#x3C; b &#x26; c text.");
  });

  it("renders a custom handler with role classes and variant data", () => {
    expect(html).toContain(
      '<aside class="p-callout p-callout-border" data-kind="warning"><span class="p-callout-marker">Careful</span><div class="p-callout-text"><p class="p-paragraph p-paragraph-text">Mind the gap.</p></div></aside>',
    );
  });

  it("renders directives without a handler as div or span", () => {
    expect(html).toContain(
      '<span class="p-badge p-badge-surface" data-tone="danger">new</span>',
    );
    expect(html).toContain('<div class="p-rule p-rule-border"></div>');
  });

  it("writes no style attribute", () => {
    expect(html).not.toContain("style=");
  });

  it("returns a hast root and copies node positions", () => {
    const tree = renderer.tree("guide");
    expect(tree.type).toBe("root");
    const first = tree.children[0];
    expect(first?.type === "element" && first.tagName).toBe("h1");
    expect(first?.type === "element" && first.position?.start.line).toBe(5);
  });

  it("renders a document that is not in the source", () => {
    const other = document("Hello *there*.\n");
    const root = renderer.render(other);
    expect(root.children).toHaveLength(1);
    expect(renderer.document("guide").data.id).toBe("guide");
  });

  it("reads the source at call time", () => {
    const prosary = store();
    const live = defineRenderer(prosary, styled, { callout });
    prosary.apply({
      id: "fr",
      name: "French",
      documents: {
        guide: { setup: { children: [{ type: "text", value: "Guide" }] } },
      },
    });
    expect(live.html("guide")).toContain(
      '<h1 class="p-heading p-heading-text">Guide</h1>',
    );
  });

  it("exposes the sheet of the style", () => {
    expect(renderer.sheet()).toBe(styled.sheet());
  });

  it("throws for a kind with no handler", async () => {
    const { defineContract } = await import("@prosary/schema");
    const { makeProsary } = await import("@prosary/core");
    const odd = defineContract({
      kinds: {
        ...contract.kinds,
        footnote: {
          match: { type: "footnoteDefinition" },
          level: "block",
          content: "block",
        },
      },
    });
    const empty = makeProsary(odd, { documents: {}, patch: {} });
    expect(() => defineRenderer(empty, defineStyle(odd, {}), {})).toThrow(
      UncoveredKindError,
    );
  });
});
