import { describe, expect, it } from "vitest";

import { codes, contract, first, meta, paragraph, text, tree } from "./fixture";

const { rules } = meta;

/** Runs the contract rules on a contract. */
const contractIssue = (c: unknown) => first(rules.contract, c);

describe("contract", () => {
  it("accepts the fixture contract", () => {
    expect(contractIssue(contract)).toBeUndefined();
  });

  it("accepts a minimal contract", () => {
    expect(contractIssue({ kinds: {} })).toBeUndefined();
  });

  it("rejects a non-object, an unknown key, and a missing kinds", () => {
    expect(first(rules.contract, 1)?.code).toBe("not_object");
    expect(contractIssue({ kinds: {}, extra: 1 })?.code).toBe("unknown_key");
    expect(first(rules.contract, {})?.code).toBe("missing_key");
  });

  it("rejects a kind that lacks a required member", () => {
    const issue = contractIssue({
      kinds: { a: { match: { type: "x" }, level: "block" } },
    });
    expect(issue?.code).toBe("missing_key");
    expect(issue?.path).toEqual(["kinds", "a", "content"]);
  });

  it("rejects a match with both or neither form", () => {
    expect(
      contractIssue({
        kinds: {
          a: {
            match: { type: "x", directive: "y" },
            level: "block",
            content: "none",
          },
        },
      })?.code,
    ).toBe("no_match");
    expect(
      contractIssue({
        kinds: { a: { match: {}, level: "block", content: "none" } },
      })?.code,
    ).toBe("no_match");
    expect(
      contractIssue({
        kinds: { a: { match: { type: "" }, level: "block", content: "none" } },
      })?.code,
    ).toBe("no_match");
  });

  it("rejects an unknown level and a content list with an unknown kind", () => {
    expect(
      contractIssue({
        kinds: { a: { match: { type: "x" }, level: "flow", content: "none" } },
      })?.code,
    ).toBe("not_member");
    const issue = contractIssue({
      ...contract,
      kinds: {
        ...contract.kinds,
        blockquote: { ...contract.kinds.blockquote, content: ["ghost"] },
      },
    });
    expect(issue?.code).toBe("no_match");
    expect(issue?.path).toEqual(["kinds", "blockquote", "content"]);
  });

  it("rejects attribute definitions with bad semantics", () => {
    const withAttr = (attribute: unknown) => ({
      kinds: {
        a: {
          match: { type: "x" },
          level: "block",
          content: "none",
          attributes: { v: attribute },
        },
      },
    });
    expect(contractIssue(withAttr({ type: "color" }))?.code).toBe("not_member");
    expect(contractIssue(withAttr({ type: "enum" }))?.code).toBe("missing_key");
    expect(contractIssue(withAttr({ type: "enum", values: [] }))?.code).toBe(
      "missing_key",
    );
    expect(
      contractIssue(withAttr({ type: "enum", values: ["a", "a"] }))?.code,
    ).toBe("duplicate");
    expect(
      contractIssue(withAttr({ type: "number", min: 5, max: 1 }))?.code,
    ).toBe("out_of_range");
    const bad = first(
      rules.contract,
      withAttr({ type: "number", default: "3" }),
    );
    expect(bad?.code).toBe("not_number");
    expect(bad?.path).toEqual(["kinds", "a", "attributes", "v", "default"]);
    expect(
      first(
        rules.contract,
        withAttr({ type: "enum", values: ["a"], default: "b" }),
      )?.code,
    ).toBe("not_member");
    expect(
      contractIssue(withAttr({ type: "url", protocols: ["https", ""] }))?.code,
    ).toBe("empty");
    expect(
      contractIssue(withAttr({ type: "string", required: "yes" }))?.code,
    ).toBe("not_boolean");
  });

  it("rejects the reserved id attribute", () => {
    const issue = contractIssue({
      kinds: {
        a: {
          match: { directive: "x" },
          level: "block",
          content: "none",
          attributes: { id: { type: "string" } },
        },
      },
    });
    expect(issue?.code).toBe("unknown_key");
    expect(issue?.path).toEqual(["kinds", "a", "attributes", "id"]);
  });

  it("rejects duplicate roles", () => {
    expect(
      contractIssue({
        kinds: {
          a: {
            match: { type: "x" },
            level: "block",
            content: "none",
            roles: ["text", "text"],
          },
        },
      })?.code,
    ).toBe("duplicate");
  });

  it("rejects two kinds with the same match", () => {
    const dup = contractIssue({
      kinds: {
        a: { match: { directive: "x" }, level: "block", content: "none" },
        b: { match: { directive: "x" }, level: "block", content: "none" },
      },
    });
    expect(dup?.code).toBe("duplicate");
    expect(dup?.path).toEqual(["kinds", "b", "match"]);
    expect(
      contractIssue({
        kinds: {
          a: {
            match: { type: "heading", where: { depth: 1 } },
            level: "block",
            content: "none",
          },
          b: {
            match: { type: "heading", where: { depth: 1 } },
            level: "block",
            content: "none",
          },
        },
      })?.code,
    ).toBe("duplicate");
    expect(
      contractIssue({
        kinds: {
          a: {
            match: { type: "heading", where: { depth: 1 } },
            level: "block",
            content: "none",
          },
          b: { match: { type: "heading" }, level: "block", content: "none" },
        },
      }),
    ).toBeUndefined();
  });
});

describe("kind", () => {
  it("accepts known names and rejects the rest", () => {
    expect(first(rules.kind, "callout")).toBeUndefined();
    expect(codes(rules.kind, "ghost")).toContain("not_member");
    expect(codes(rules.kind, 1)).toContain("not_string");
  });
});

describe("reference", () => {
  it("accepts the reference forms and rejects the rest", () => {
    expect(first(rules.reference, "doc:a#b")).toBeUndefined();
    expect(first(rules.reference, "#b")).toBeUndefined();
    expect(first(rules.reference, "https://x")?.code).toBe("not_reference");
    expect(first(rules.reference, 1)?.code).toBe("not_string");
  });
});

describe("override, patch, and layer", () => {
  const override = {
    attributes: { kind: "warning" },
    children: [paragraph(text("x"))],
  };

  it("accept well-formed overlays", () => {
    expect(first(rules.override, override)).toBeUndefined();
    expect(first(rules.override, {})).toBeUndefined();
    expect(first(rules.patch, {})).toBeUndefined();
    expect(
      first(rules.patch, {
        documents: { guide: { "callout[0]": override } },
      }),
    ).toBeUndefined();
    expect(
      first(rules.layer, {
        id: "fr",
        name: "French",
        documents: { guide: { "callout[0]": override } },
      }),
    ).toBeUndefined();
  });

  it("reject an override with an unknown key or a child that does not bind", () => {
    expect(first(rules.override, { extra: 1 })?.code).toBe("unknown_key");
    expect(first(rules.override, { attributes: "x" })?.code).toBe("not_object");
    const issue = first(rules.override, {
      children: [{ type: "html", value: "x" }],
    });
    expect(issue?.code).toBe("raw_html");
    expect(issue?.path).toEqual(["children", "0"]);
    expect(first(rules.override, 1)?.code).toBe("not_object");
  });

  it("reject a patch with bad documents or members", () => {
    expect(first(rules.patch, { documents: { guide: "x" } })?.code).toBe(
      "not_object",
    );
    expect(
      first(rules.patch, { documents: { guide: { a: { extra: 1 } } } })?.path,
    ).toEqual(["documents", "guide", "a", "extra"]);
    expect(first(rules.patch, { id: "" })?.code).toBe("empty");
    expect(first(rules.patch, { extra: 1 })?.code).toBe("unknown_key");
  });

  it("require an identity on a layer", () => {
    expect(first(rules.layer, { name: "x" })?.code).toBe("missing_key");
    expect(first(rules.layer, { id: "x" })?.path).toEqual(["name"]);
  });
});

describe("node and document", () => {
  it("return the first bind issue", () => {
    expect(first(rules.node, paragraph(text("x")))).toBeUndefined();
    expect(first(rules.node, { type: "html", value: "x" })?.code).toBe(
      "raw_html",
    );
    expect(first(rules.document, tree)).toBeUndefined();
    expect(
      first(rules.document, {
        type: "root",
        children: [{ type: "html", value: "x" }, { type: "code" }],
      })?.code,
    ).toBe("raw_html");
  });
});
