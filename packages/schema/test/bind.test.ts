import { describe, expect, it } from "vitest";

import type { Node } from "../src/types";
import type { contract } from "./fixture";
import { issueCodes, meta, paragraph, text, tree } from "./fixture";

const { bind } = meta;

const root = (...children: unknown[]) => ({ type: "root", children });

describe("bind.document", () => {
  const result = bind.document(tree, { id: "guide" });

  it("binds a valid tree", () => {
    expect(result.success).toBe(true);
  });

  it("sets the document id and keeps the mdast fields", () => {
    if (!result.success) {
      return;
    }
    expect(result.data.type).toBe("root");
    expect(result.data.data.id).toBe("guide");
    expect(result.data.children.length).toBe(tree.children.length);
    expect(result.data.children[0]?.type).toBe("heading");
    expect(result.data.children[0]?.depth).toBe(1);
  });

  it("resolves kinds, with the most specific where match first", () => {
    if (!result.success) {
      return;
    }
    const kinds = result.data.children.map((n) => n.data.kind);
    expect(kinds).toEqual([
      "title",
      "heading",
      "paragraph",
      "callout",
      "rule",
      "blockquote",
      "code",
    ]);
  });

  it("assigns explicit, slug, and structural ids", () => {
    if (!result.success) {
      return;
    }
    const ids = result.data.children.map((n) => n.data.id);
    expect(ids).toEqual([
      "setup-guide",
      "install",
      "paragraph[0]",
      "callout[0]",
      "rule[0]",
      "blockquote[0]",
      "code[0]",
    ]);
    const quote = result.data.children[5];
    expect(quote?.children?.[0]?.data.id).toBe("blockquote[0]/paragraph[0]");
    expect(quote?.children?.[0]?.children?.[0]?.data.id).toBe(
      "blockquote[0]/paragraph[0]/text[0]",
    );
  });

  it("binds the attributes of standard kinds from their fields", () => {
    if (!result.success) {
      return;
    }
    expect(result.data.children[0]?.data.attributes).toEqual({ depth: 1 });
    expect(result.data.children[6]?.data.attributes).toEqual({
      lang: "ts",
      value: "let x = 1;",
    });
    const links = result.data.children[2]?.children?.filter(
      (n) => n.data.kind === "link",
    );
    expect(links?.[0]?.data.attributes).toEqual({ url: "#install" });
    expect(links?.[1]?.data.attributes).toEqual({
      url: "doc:other#intro",
      title: "Other",
    });
  });

  it("binds, coerces, and defaults the attributes of directives", () => {
    if (!result.success) {
      return;
    }
    expect(result.data.children[3]?.data.attributes).toEqual({
      kind: "warning",
      draft: true,
      weight: 3,
    });
    const badge = result.data.children[2]?.children?.find(
      (n) => n.data.kind === "badge",
    );
    expect(badge?.data.attributes).toEqual({ tone: "danger" });
  });

  it("collects every reference the document makes", () => {
    if (!result.success) {
      return;
    }
    expect(result.data.data.references).toEqual([
      { node: "install" },
      { document: "other", node: "intro" },
    ]);
  });

  it("keeps existing data and reads the id from it when no option is given", () => {
    const given = bind.document({
      type: "root",
      data: { id: "from-data", extra: 1 },
      children: [paragraph(text("x"))],
    });
    expect(given.success).toBe(true);
    if (given.success) {
      expect(given.data.data.id).toBe("from-data");
      expect((given.data.data as { extra?: number }).extra).toBe(1);
    }
  });

  it("falls back to an empty document id", () => {
    const anon = bind.document(root(paragraph(text("x"))));
    expect(anon.success && anon.data.data.id).toBe("");
  });

  it("does not change the input tree", () => {
    const copy = structuredClone(tree);
    bind.document(tree);
    expect(tree).toEqual(copy);
  });
});

describe("bind.document issues", () => {
  it("rejects a value that is not a root", () => {
    expect(
      issueCodes(bind.document({ type: "paragraph", children: [] })),
    ).toEqual(["type_mismatch"]);
    expect(issueCodes(bind.document(null))).toEqual(["type_mismatch"]);
  });

  it("reports unknown_node for a node no kind matches, with its path", () => {
    const result = bind.document(root({ type: "thematicBreak" }));
    expect(issueCodes(result)).toEqual(["unknown_node"]);
    if (!result.success) {
      expect(result.issues[0]?.path).toEqual(["children", "0"]);
    }
  });

  it("reports unknown_node for a malformed node", () => {
    expect(issueCodes(bind.document(root("text")))).toEqual(["unknown_node"]);
    expect(issueCodes(bind.document(root({ children: [] })))).toEqual([
      "unknown_node",
    ]);
  });

  it("reports unknown_node for a directive with an unknown name", () => {
    expect(
      issueCodes(
        bind.document(
          root({
            type: "leafDirective",
            name: "nope",
            attributes: {},
            children: [],
          }),
        ),
      ),
    ).toEqual(["unknown_node"]);
    expect(
      issueCodes(
        bind.document(
          root({ type: "leafDirective", attributes: {}, children: [] }),
        ),
      ),
    ).toEqual(["unknown_node"]);
  });

  it("reports raw_html for an html node", () => {
    expect(
      issueCodes(bind.document(root({ type: "html", value: "<b>" }))),
    ).toEqual(["raw_html"]);
  });

  it("reports invalid_child for a kind outside the content model", () => {
    const result = bind.document(root(paragraph(paragraph(text("x")))));
    expect(issueCodes(result)).toEqual(["invalid_child"]);
    if (!result.success) {
      expect(result.issues[0]?.path).toEqual([
        "children",
        "0",
        "children",
        "0",
      ]);
      expect(result.issues[0]?.received).toBe("paragraph");
    }
    expect(
      issueCodes(
        bind.document(
          root({
            type: "blockquote",
            children: [{ type: "code", value: "x" }],
          }),
        ),
      ),
    ).toEqual(["invalid_child"]);
    expect(issueCodes(bind.document(root(text("top"))))).toEqual([
      "invalid_child",
    ]);
  });

  it("reports invalid_child for children under a kind with no content", () => {
    const result = bind.document(
      root({ type: "code", value: "x", children: [text("y")] }),
    );
    expect(issueCodes(result)).toEqual(["invalid_child"]);
    if (!result.success) {
      expect(result.issues[0]?.path).toEqual(["children", "0", "children"]);
    }
  });

  it("reports missing_attribute for a required attribute", () => {
    const result = bind.document(root({ type: "code", lang: "ts" }));
    expect(issueCodes(result)).toEqual(["missing_attribute"]);
    if (!result.success) {
      expect(result.issues[0]?.path).toEqual(["children", "0", "value"]);
    }
    expect(
      issueCodes(
        bind.document(
          root(paragraph({ type: "link", title: null, children: [] })),
        ),
      ),
    ).toEqual(["missing_attribute"]);
  });

  it("treats null as a missing field of a standard kind", () => {
    expect(
      issueCodes(bind.document(root({ type: "code", lang: null, value: "x" }))),
    ).toEqual([]);
  });

  it("reports invalid_attribute with the atom message and the path", () => {
    const result = bind.document(
      root({ type: "heading", depth: 4, children: [text("x")] }),
    );
    expect(issueCodes(result)).toEqual(["invalid_attribute"]);
    if (!result.success) {
      expect(result.issues[0]?.path).toEqual(["children", "0", "depth"]);
      expect(result.issues[0]?.message).toContain("between 2 and 3");
      expect(result.issues[0]?.received).toBe(4);
    }
    const bad = bind.document(
      root({
        type: "containerDirective",
        name: "callout",
        attributes: { kind: "loud", weight: "x" },
        children: [],
      }),
    );
    expect(issueCodes(bad)).toEqual(["invalid_attribute", "invalid_attribute"]);
    if (!bad.success) {
      expect(bad.issues[0]?.path).toEqual([
        "children",
        "0",
        "attributes",
        "kind",
      ]);
      expect(bad.issues[1]?.received).toBe("x");
    }
  });

  it("rejects a url with a protocol outside the list", () => {
    expect(
      issueCodes(
        bind.document(
          root(
            paragraph({
              type: "link",
              url: "javascript:alert(1)",
              children: [],
            }),
          ),
        ),
      ),
    ).toEqual(["invalid_attribute"]);
    expect(
      issueCodes(
        bind.document(
          root(paragraph({ type: "link", url: "http://x", children: [] })),
        ),
      ),
    ).toEqual(["invalid_attribute"]);
  });

  it("reports unknown_attribute for an undeclared directive attribute", () => {
    const result = bind.document(
      root({
        type: "containerDirective",
        name: "callout",
        attributes: { class: "big" },
        children: [],
      }),
    );
    expect(issueCodes(result)).toEqual(["unknown_attribute"]);
    if (!result.success) {
      expect(result.issues[0]?.path).toEqual([
        "children",
        "0",
        "attributes",
        "class",
      ]);
    }
  });

  it("permits the reserved id attribute on a directive", () => {
    const result = bind.document(
      root({
        type: "containerDirective",
        name: "callout",
        attributes: { id: "warn" },
        children: [],
      }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.children[0]?.data.id).toBe("warn");
      expect(result.data.children[0]?.data.attributes).toEqual({
        kind: "note",
      });
    }
  });

  it("ignores undeclared fields of a standard kind", () => {
    expect(
      issueCodes(
        bind.document(
          root({ type: "code", value: "x", meta: "m", lang: "ts" }),
        ),
      ),
    ).toEqual([]);
  });

  it("reports duplicate_id for a repeated id", () => {
    const result = bind.document(
      root(
        { type: "heading", depth: 2, children: [text("Same")] },
        { type: "heading", depth: 2, children: [text("Same")] },
      ),
    );
    expect(issueCodes(result)).toEqual(["duplicate_id"]);
    if (!result.success) {
      expect(result.issues[0]?.path).toEqual(["children", "1"]);
      expect(result.issues[0]?.received).toBe("same");
    }
    expect(
      issueCodes(
        bind.document(
          root(
            {
              type: "leafDirective",
              name: "rule",
              attributes: { id: "x" },
              children: [],
            },
            {
              type: "leafDirective",
              name: "rule",
              attributes: { id: "x" },
              children: [],
            },
          ),
        ),
      ),
    ).toEqual(["duplicate_id"]);
  });

  it("reports unknown_reference for a local reference to no node", () => {
    const result = bind.document(
      root(paragraph({ type: "link", url: "#missing", children: [] })),
      { id: "guide" },
    );
    expect(issueCodes(result)).toEqual(["unknown_reference"]);
    if (!result.success) {
      expect(result.issues[0]?.path).toEqual([
        "children",
        "0",
        "children",
        "0",
        "url",
      ]);
    }
    expect(
      issueCodes(
        bind.document(
          root(
            paragraph({ type: "link", url: "doc:guide#missing", children: [] }),
          ),
          { id: "guide" },
        ),
      ),
    ).toEqual(["unknown_reference"]);
  });

  it("keeps a reference to another document for the caller", () => {
    const result = bind.document(
      root(
        paragraph(
          { type: "link", url: "doc:elsewhere#missing", children: [] },
          { type: "link", url: "doc:elsewhere", children: [] },
        ),
      ),
      { id: "guide" },
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.data.references).toEqual([
        { document: "elsewhere", node: "missing" },
        { document: "elsewhere" },
      ]);
    }
  });

  it("collects every issue in one pass", () => {
    const result = bind.document(
      root(
        { type: "html", value: "<b>" },
        { type: "heading", depth: 9, children: [text("x")] },
        { type: "code" },
        paragraph(paragraph(text("deep"))),
      ),
    );
    expect(issueCodes(result).sort()).toEqual([
      "invalid_attribute",
      "invalid_child",
      "missing_attribute",
      "raw_html",
    ]);
  });
});

describe("bind.node", () => {
  it("binds a node of any kind without a parent", () => {
    const result = bind.node(paragraph(text("hi")));
    expect(result.success).toBe(true);
    if (result.success) {
      const node: Node<typeof contract> = result.data;
      expect(node.data.kind).toBe("paragraph");
      expect(node.data.id).toBe("paragraph[0]");
      expect(node.children?.[0]?.data.id).toBe("paragraph[0]/text[0]");
    }
    expect(bind.node(text("inline")).success).toBe(true);
  });

  it("reports the issues of the subtree", () => {
    expect(issueCodes(bind.node({ type: "thematicBreak" }))).toEqual([
      "unknown_node",
    ]);
    expect(
      issueCodes(bind.node(paragraph({ type: "html", value: "x" }))),
    ).toEqual(["raw_html"]);
    expect(
      issueCodes(
        bind.node(paragraph({ type: "link", url: "#nope", children: [] })),
      ),
    ).toEqual(["unknown_reference"]);
  });
});

describe("bind.override", () => {
  const bound = bind.document(tree, { id: "guide" });
  const callout = bound.success ? bound.data.children[3] : undefined;

  it("merges attributes under the rules of the kind", () => {
    if (!callout) {
      return;
    }
    const result = bind.override(callout, {
      attributes: { kind: "note", weight: 7 },
    });
    expect(result.success && result.data.data.attributes).toEqual({
      kind: "note",
      draft: true,
      weight: 7,
    });
    expect(result.success && result.data.children?.length).toBe(1);
  });

  it("drops, resets, or requires an attribute set to undefined", () => {
    if (!callout) {
      return;
    }
    const dropped = bind.override(callout, {
      attributes: { draft: undefined },
    });
    expect(dropped.success && dropped.data.data.attributes).toEqual({
      kind: "warning",
      weight: 3,
    });
    const reset = bind.override(callout, { attributes: { kind: undefined } });
    expect(reset.success && reset.data.data.attributes).toEqual({
      kind: "note",
      draft: true,
      weight: 3,
    });
    const code = bound.success ? bound.data.children[6] : undefined;
    if (code) {
      expect(
        issueCodes(bind.override(code, { attributes: { value: undefined } })),
      ).toEqual(["missing_attribute"]);
    }
  });

  it("rejects an unknown or invalid attribute without coercion", () => {
    if (!callout) {
      return;
    }
    expect(
      issueCodes(bind.override(callout, { attributes: { class: "x" } })),
    ).toEqual(["unknown_attribute"]);
    const bad = bind.override(callout, { attributes: { weight: "3" } });
    expect(issueCodes(bad)).toEqual(["invalid_attribute"]);
    if (!bad.success) {
      expect(bad.issues[0]?.path).toEqual(["attributes", "weight"]);
    }
  });

  it("binds replacement children under the content model and the id of the node", () => {
    if (!callout) {
      return;
    }
    const result = bind.override(callout, {
      children: [paragraph(text("Changed.")), paragraph(text("More."))],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.children?.map((n) => n.data.id)).toEqual([
        "callout[0]/paragraph[0]",
        "callout[0]/paragraph[1]",
      ]);
      expect(result.data.data.attributes).toEqual(callout.data.attributes);
    }
    expect(
      issueCodes(bind.override(callout, { children: [text("loose")] })),
    ).toEqual(["invalid_child"]);
  });

  it("returns the node unchanged for an empty override", () => {
    if (!callout) {
      return;
    }
    const result = bind.override(callout, {});
    expect(result.success && result.data).toEqual(callout);
  });
});

describe("bind.overrides", () => {
  const bound = bind.document(tree, { id: "guide" });
  const document = bound.success ? bound.data : undefined;

  it("accepts overrides that name nodes of the document", () => {
    if (!document) {
      return;
    }
    const overrides = {
      "callout[0]": { attributes: { kind: "note" } },
      install: { children: [text("Installation")] },
    };
    const result = bind.overrides(document, overrides);
    expect(result.success && result.data).toBe(overrides);
    expect(bind.overrides(document, {}).success).toBe(true);
  });

  it("reports an unknown node id, a bad override, and the issues of an override", () => {
    if (!document) {
      return;
    }
    expect(issueCodes(bind.overrides(document, { ghost: {} }))).toEqual([
      "unknown_reference",
    ]);
    expect(issueCodes(bind.overrides(document, { install: 1 }))).toEqual([
      "not_object",
    ]);
    expect(
      issueCodes(bind.overrides(document, { install: { extra: 1 } })),
    ).toEqual(["unknown_key"]);
    expect(
      issueCodes(bind.overrides(document, { install: { attributes: 1 } })),
    ).toEqual(["not_object"]);
    expect(
      issueCodes(bind.overrides(document, { install: { children: 1 } })),
    ).toEqual(["not_array"]);
    const nested = bind.overrides(document, {
      install: { children: [{ type: "html", value: "x" }] },
    });
    expect(issueCodes(nested)).toEqual(["raw_html"]);
    if (!nested.success) {
      expect(nested.issues[0]?.path).toEqual(["install", "children", "0"]);
    }
    expect(issueCodes(bind.overrides(document, "x"))).toEqual(["not_object"]);
  });

  it("collects the issues of every entry", () => {
    if (!document) {
      return;
    }
    expect(
      issueCodes(bind.overrides(document, { ghost: {}, install: 1 })).sort(),
    ).toEqual(["not_object", "unknown_reference"]);
  });
});
