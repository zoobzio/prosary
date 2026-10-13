import type { Contract, Issue, Rule } from "../src/types";

import { defineMeta } from "../src/meta";

/**
 * A contract for the test suites. The contract has standard kinds, two kinds
 * on one mdast type with a `where` match, a container directive with typed
 * attributes, a text directive, and a leaf directive.
 */
export const contract = {
  kinds: {
    text: {
      match: { type: "text" },
      level: "inline",
      content: "none",
      attributes: { value: { type: "string" } },
    },
    emphasis: {
      match: { type: "emphasis" },
      level: "inline",
      content: "inline",
      roles: ["text"],
    },
    link: {
      match: { type: "link" },
      level: "inline",
      content: "inline",
      attributes: {
        url: { type: "url", protocols: ["https", "mailto", "doc"] },
        title: { type: "string", required: false },
      },
      roles: ["text"],
    },
    badge: {
      match: { directive: "badge" },
      level: "inline",
      content: "inline",
      attributes: {
        tone: { type: "enum", values: ["info", "danger"], default: "info" },
      },
      roles: ["surface", "text"],
    },
    title: {
      match: { type: "heading", where: { depth: 1 } },
      level: "block",
      content: "inline",
      attributes: { depth: { type: "number", min: 1, max: 1 } },
      roles: ["text"],
    },
    heading: {
      match: { type: "heading" },
      level: "block",
      content: "inline",
      attributes: {
        depth: { type: "number", min: 2, max: 3, integer: true },
      },
      roles: ["text"],
    },
    paragraph: {
      match: { type: "paragraph" },
      level: "block",
      content: "inline",
      roles: ["text"],
    },
    code: {
      match: { type: "code" },
      level: "block",
      content: "none",
      attributes: {
        lang: { type: "string", required: false },
        value: { type: "string" },
      },
      roles: ["surface", "text"],
    },
    blockquote: {
      match: { type: "blockquote" },
      level: "block",
      content: ["paragraph"],
      roles: ["border", "text"],
    },
    callout: {
      match: { directive: "callout" },
      level: "block",
      content: "block",
      attributes: {
        kind: { type: "enum", values: ["note", "warning"], default: "note" },
        draft: { type: "boolean", required: false },
        weight: { type: "number", required: false, integer: true },
        accent: { type: "token", required: false },
      },
      roles: ["border", "marker", "text"],
    },
    rule: {
      match: { directive: "rule" },
      level: "block",
      content: "none",
      roles: ["border"],
    },
  },
} as const satisfies Contract;

/** The meta of the fixture contract. */
export const meta = defineMeta(contract);

/** Makes a text node. */
export const text = (value: string) => ({ type: "text", value });

/** Makes a paragraph of text nodes. */
export const paragraph = (...children: unknown[]) => ({
  type: "paragraph",
  children,
});

/**
 * A raw tree that satisfies the contract. The tree has a title, a heading, a
 * paragraph with a link to the heading and a link to another document, a
 * callout with a boolean flag, a badge, a leaf directive, and a blockquote.
 */
export const tree = {
  type: "root",
  children: [
    { type: "heading", depth: 1, children: [text("Setup Guide")] },
    { type: "heading", depth: 2, children: [text("Install")] },
    paragraph(
      text("See "),
      {
        type: "link",
        url: "#install",
        title: null,
        children: [text("Install")],
      },
      text(" and "),
      {
        type: "link",
        url: "doc:other#intro",
        title: "Other",
        children: [text("the other guide")],
      },
      text(" and "),
      { type: "emphasis", children: [text("note")] },
      text(" "),
      {
        type: "textDirective",
        name: "badge",
        attributes: { tone: "danger" },
        children: [text("new")],
      },
    ),
    {
      type: "containerDirective",
      name: "callout",
      attributes: { kind: "warning", draft: null, weight: "3" },
      children: [paragraph(text("Careful."))],
    },
    { type: "leafDirective", name: "rule", attributes: {}, children: [] },
    { type: "blockquote", children: [paragraph(text("Quoted."))] },
    { type: "code", lang: "ts", value: "let x = 1;" },
  ],
};

/** Runs a rule list and returns the first issue. */
export const first = (rules: Rule[], v: unknown): Issue | undefined => {
  for (const rule of rules) {
    const issue = rule(v);
    if (issue) {
      return issue;
    }
  }
  return undefined;
};

/** Returns the issue codes of a rule list for a value, in order. */
export const codes = (rules: Rule[], v: unknown): Issue["code"][] => {
  const found: Issue["code"][] = [];
  for (const rule of rules) {
    const issue = rule(v);
    if (issue) {
      found.push(issue.code);
    }
  }
  return found;
};

/** Returns the issue codes of a failed result. Returns `[]` on success. */
export const issueCodes = (result: {
  success: boolean;
  issues?: Issue[];
}): Issue["code"][] =>
  result.success ? [] : (result.issues ?? []).map((i) => i.code);
