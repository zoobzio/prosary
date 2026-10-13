import { describe, expect, it } from "vitest";

import { defineContract } from "@prosary/schema";

import { ParseError } from "../src/error";
import { defineParser } from "../src/parser";
import { contract, source } from "./fixture";

const { parse } = defineParser();
const tree = parse(source);

describe("defineParser", () => {
  it("parses CommonMark into an mdast root with positions", () => {
    expect(tree.type).toBe("root");
    expect(tree.children[0]?.type).toBe("heading");
    expect(tree.children[0]?.position?.start.line).toBe(7);
    expect(tree.children.map((n) => n.type)).toEqual([
      "heading",
      "heading",
      "paragraph",
      "containerDirective",
      "leafDirective",
      "table",
      "code",
    ]);
  });

  it("moves the frontmatter to the root data and reads the id", () => {
    expect(tree.data?.matter).toEqual({
      id: "guide",
      title: "Setup Guide",
      tags: ["intro", "setup"],
    });
    expect(tree.data?.id).toBe("guide");
  });

  it("parses directives with their attributes as strings", () => {
    const callout = tree.children[3];
    expect(callout?.type).toBe("containerDirective");
    if (callout?.type === "containerDirective") {
      expect(callout.name).toBe("callout");
      expect(callout.attributes).toEqual({
        kind: "warning",
        draft: "",
        weight: "3",
      });
      expect(callout.children[0]?.type).toBe("paragraph");
    }
    const rule = tree.children[4];
    expect(rule?.type === "leafDirective" && rule.name).toBe("rule");
    const paragraph = tree.children[2];
    const badge =
      paragraph?.type === "paragraph"
        ? paragraph.children.find((n) => n.type === "textDirective")
        : undefined;
    expect(badge?.type === "textDirective" && badge.name).toBe("badge");
    expect(badge?.type === "textDirective" && badge.attributes).toEqual({
      tone: "danger",
    });
  });

  it("parses the GFM extensions", () => {
    expect(tree.children[5]?.type).toBe("table");
    const struck = parse("~~gone~~").children[0];
    expect(struck?.type === "paragraph" && struck.children[0]?.type).toBe(
      "delete",
    );
  });

  it("reads an explicit heading id and strips the marker", () => {
    const install = tree.children[1];
    expect(install?.type === "heading" && install.data?.id).toBe("install");
    expect(install?.type === "heading" && install.children).toEqual([
      { type: "text", value: "Install", position: expect.anything() },
    ]);
    const title = tree.children[0];
    expect(title?.type === "heading" && title.data?.id).toBeUndefined();
  });

  it("reads a heading id inside a container and a heading that is only a marker", () => {
    const nested = parse("> ## Deep {#deep}");
    const quote = nested.children[0];
    const heading =
      quote?.type === "blockquote" ? quote.children[0] : undefined;
    expect(heading?.type === "heading" && heading.data?.id).toBe("deep");
    const bare = parse("## {#only}").children[0];
    expect(bare?.type === "heading" && bare.data?.id).toBe("only");
    expect(bare?.type === "heading" && bare.children).toEqual([]);
    const notLast = parse("## Keep {#no} *tail*").children[0];
    expect(notLast?.type === "heading" && notLast.data?.id).toBeUndefined();
  });

  it("leaves a document with no frontmatter alone", () => {
    const plain = parse("# Hi\n");
    expect(plain.data).toBeUndefined();
    expect(plain.children).toHaveLength(1);
  });

  it("keeps frontmatter with no id off the root id", () => {
    const anon = parse("---\ntitle: T\n---\n\n# Hi\n");
    expect(anon.data?.matter).toEqual({ title: "T" });
    expect(anon.data?.id).toBeUndefined();
  });

  it("throws a ParseError for malformed YAML and for a non-map", () => {
    expect(() => parse("---\nid: [\n---\n")).toThrow(ParseError);
    expect(() => parse("---\n- a\n- b\n---\n")).toThrow(ParseError);
    try {
      parse("---\n- a\n---\n\n# Hi\n");
    } catch (error) {
      expect(error).toBeInstanceOf(ParseError);
      expect((error as ParseError).position?.start.line).toBe(1);
      expect((error as ParseError).message).toBe(
        "Frontmatter must be a YAML map.",
      );
    }
  });

  it("is reusable across parses", () => {
    expect(parse("a").children).toHaveLength(1);
    expect(parse("b\n\nc").children).toHaveLength(2);
  });
});

describe("with the schema", () => {
  const schema = defineContract(contract);

  it("binds the parsed tree", () => {
    const result = schema.bind(tree);
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    const document = result.data;
    expect(document.data.id).toBe("guide");
    expect(document.data.matter).toEqual(tree.data?.matter);
    expect(document.children.map((n) => n.data.id)).toEqual([
      "setup-guide",
      "install",
      "paragraph[0]",
      "callout[0]",
      "rule[0]",
      "table[0]",
      "code[0]",
    ]);
    expect(document.children[3]?.data.attributes).toEqual({
      kind: "warning",
      draft: true,
      weight: 3,
    });
    expect(document.data.references).toEqual([
      { node: "install" },
      { document: "other", node: "intro" },
    ]);
  });

  it("rejects raw HTML from the source", () => {
    const result = schema.bind(parse("# Hi\n\n<div>bold</div>\n"));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues.map((i) => i.code)).toEqual(["raw_html"]);
    }
  });
});
