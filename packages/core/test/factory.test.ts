import type { Node, Patch } from "@prosary/schema";
import type { Config } from "../src/types";
import type { C } from "./fixture";

import { describe, expect, it } from "vitest";

import {
  InvalidDocumentError,
  InvalidLayerError,
  InvalidPatchError,
  UnknownDocumentError,
} from "../src/error";
import { makeProsary } from "../src/factory";
import { document, french, guide, intro, schema } from "./fixture";

const makeConfig = (patch: Patch = {}): Config<C> => ({
  documents: { guide, intro },
  patch,
});

/** Makes a store over a fresh container. */
const boot = (
  config = makeConfig(),
  options: Parameters<typeof makeProsary<C>>[2] = {},
) => makeProsary(schema, config, options);

/** Returns the text of the first child of a node. */
const textOf = (node: Node<C> | undefined) => node?.children?.[0]?.value;

describe("construction", () => {
  it("builds over valid documents and an empty patch", () => {
    expect(() => boot()).not.toThrow();
  });

  it("builds over a stored layer", () => {
    expect(() => boot(makeConfig(french))).not.toThrow();
  });

  it("rejects a document that violates the contract", () => {
    const broken = structuredClone(guide);
    Reflect.set(broken.children[0] ?? {}, "depth", 9);
    expect(() => boot({ documents: { guide: broken }, patch: {} })).toThrow(
      InvalidDocumentError,
    );
  });

  it("rejects a document stored under another id", () => {
    expect(() => boot({ documents: { other: guide }, patch: {} })).toThrow(
      InvalidDocumentError,
    );
  });

  it("rejects a document with no id", () => {
    const anon = document("# Hi\n");
    expect(anon.data.id).toBe("");
    expect(() => boot({ documents: { "": anon }, patch: {} })).toThrow(
      InvalidDocumentError,
    );
  });

  it("rejects a patch that names an unknown document or node", () => {
    expect(() => boot(makeConfig({ documents: { ghost: {} } }))).toThrow(
      InvalidPatchError,
    );
    expect(() =>
      boot(makeConfig({ documents: { guide: { ghost: {} } } })),
    ).toThrow(InvalidPatchError);
  });

  it("rejects a patch whose override violates the contract", () => {
    const patch = {
      documents: {
        guide: { setup: { children: [{ type: "html", value: "x" }] } },
      },
    };
    expect(() => boot(makeConfig(patch))).toThrow(InvalidPatchError);
  });
});

describe("reads", () => {
  it("lists the document ids", () => {
    expect(boot().documents()).toEqual(["guide", "intro"]);
  });

  it("returns the stored document when the patch has no override for it", () => {
    const p = boot();
    expect(p.document("guide")).toBe(guide);
  });

  it("throws on an unknown document", () => {
    expect(() => boot().document("ghost")).toThrow(UnknownDocumentError);
    expect(() => boot().node("ghost", "x")).toThrow(UnknownDocumentError);
  });

  it("returns a node by id, or undefined", () => {
    const p = boot();
    expect(p.node("guide", "setup")?.data.kind).toBe("heading");
    expect(p.node("guide", "ghost")).toBeUndefined();
  });

  it("applies the overrides of the patch to a read", () => {
    const p = boot(makeConfig(french));
    const active = p.document("guide");
    expect(active).not.toBe(guide);
    expect(textOf(p.node("guide", "setup"))).toBe("Guide d'installation");
    expect(p.node("guide", "callout[0]")?.data.attributes).toEqual({
      kind: "note",
    });
    expect(textOf(p.node("guide", "callout[0]/paragraph[0]"))).toBe(
      "Attention.",
    );
    expect(textOf(p.node("intro", "paragraph[0]"))).toBe("Bienvenue.");
  });

  it("keeps the stored document unchanged under a patch", () => {
    const p = boot(makeConfig(french));
    p.document("guide");
    expect(textOf(guide.children[0])).toBe("Setup Guide");
  });

  it("resolves references to documents and nodes", () => {
    const p = boot();
    expect(p.resolve("doc:intro")).toBe(intro);
    expect(p.resolve("doc:intro#start")?.data.kind).toBe("heading");
    expect(p.resolve("#setup", "guide")?.data.id).toBe("setup");
    expect(p.resolve({ document: "guide", node: "setup" })?.data.id).toBe(
      "setup",
    );
    expect(p.resolve("#setup")).toBeUndefined();
    expect(p.resolve("doc:ghost")).toBeUndefined();
    expect(p.resolve("doc:guide#ghost")).toBeUndefined();
    expect(p.resolve("https://x")).toBeUndefined();
  });

  it("resolves the references a document makes", () => {
    const p = boot();
    const [target] = guide.data.references;
    expect(target).toEqual({ document: "intro", node: "start" });
    expect(target && p.resolve(target)?.data.id).toBe("start");
  });
});

describe("add / remove", () => {
  it("adds a document and emits document and change", () => {
    const p = boot();
    const seen: string[] = [];
    p.on("document", (change) => {
      seen.push(`document:${change.id}:${change.before === undefined}`);
    });
    p.on("change", (change) => {
      seen.push(`change:${change.field}`);
    });
    const extra = document("---\nid: extra\n---\n\nHi.\n");
    p.add(extra);
    expect(p.documents()).toEqual(["guide", "intro", "extra"]);
    expect(p.document("extra")).toBe(extra);
    expect(seen).toEqual(["document:extra:true", "change:documents"]);
  });

  it("replaces a document with the same id", () => {
    const p = boot();
    const next = document("---\nid: guide\n---\n\n# New\n");
    let before: unknown;
    p.on("document", (change) => {
      before = change.before;
    });
    p.add(next);
    expect(p.document("guide")).toBe(next);
    expect(before).toBe(guide);
  });

  it("rejects an invalid document or one with no id", () => {
    const p = boot();
    expect(() => p.add(document("# Hi\n"))).toThrow(InvalidDocumentError);
    const broken = structuredClone(intro);
    Reflect.set(broken.children[0] ?? {}, "depth", 9);
    expect(() => p.add(broken)).toThrow(InvalidDocumentError);
  });

  it("removes a document and emits", () => {
    const p = boot();
    let after: unknown = "unset";
    p.on("document", (change) => {
      after = change.after;
    });
    p.remove("intro");
    expect(p.documents()).toEqual(["guide"]);
    expect(after).toBeUndefined();
    expect(() => p.remove("intro")).toThrow(UnknownDocumentError);
  });

  it("does not change the caller's container object identity", () => {
    const config = makeConfig();
    const p = boot(config);
    p.remove("intro");
    expect(config.documents).toEqual({ guide });
    expect(p.config).not.toBe(config);
  });
});

describe("update", () => {
  it("merges overrides at the node level and emits the touched ids", () => {
    const p = boot(makeConfig(french));
    let change:
      | { documents: string[]; before: Patch; after: Patch }
      | undefined;
    p.on("patch", (c) => {
      change = c;
    });
    p.update({
      documents: {
        guide: { setup: { children: [{ type: "text", value: "Guide" }] } },
      },
    });
    expect(textOf(p.node("guide", "setup"))).toBe("Guide");
    expect(p.node("guide", "callout[0]")?.data.attributes).toEqual({
      kind: "note",
    });
    expect(textOf(p.node("intro", "paragraph[0]"))).toBe("Bienvenue.");
    expect(change?.documents).toEqual(["guide"]);
    expect(change?.before).toBe(french);
    expect(p.config.patch.id).toBe("fr");
  });

  it("replaces the identity when the patch has one", () => {
    const p = boot(makeConfig(french));
    p.update({ id: "draft", name: "Draft" });
    expect(p.config.patch.id).toBe("draft");
    expect(p.config.patch.name).toBe("Draft");
    expect(p.config.patch.documents).toEqual(french.documents);
  });

  it("rejects an invalid patch and leaves the state alone", () => {
    const p = boot();
    expect(() => p.update({ documents: { ghost: {} } })).toThrow(
      InvalidPatchError,
    );
    expect(() => p.update({ documents: { guide: { ghost: {} } } })).toThrow(
      InvalidPatchError,
    );
    expect(() =>
      p.update({
        documents: { guide: { setup: { attributes: { depth: 9 } } } },
      }),
    ).toThrow(InvalidPatchError);
    expect(() => p.update({ extra: 1 } as Patch)).toThrow(InvalidPatchError);
    expect(p.config.patch).toEqual({});
  });

  it("reports no touched id when the overrides do not change", () => {
    const p = boot(makeConfig(french));
    let touched: string[] | undefined;
    p.on("patch", (c) => {
      touched = c.documents;
    });
    p.update({ documents: { intro: french.documents.intro } });
    expect(touched).toEqual([]);
  });
});

describe("apply / create", () => {
  it("stores a copy of the layer as the patch", () => {
    const p = boot();
    p.apply(french);
    expect(p.config.patch).toEqual(french);
    expect(p.config.patch).not.toBe(french);
    expect(textOf(p.node("intro", "paragraph[0]"))).toBe("Bienvenue.");
  });

  it("replaces the stored patch and emits the touched ids", () => {
    const p = boot(makeConfig(french));
    let touched: string[] | undefined;
    p.on("patch", (c) => {
      touched = c.documents;
    });
    p.apply({ id: "en", name: "English", documents: {} });
    expect(textOf(p.node("guide", "setup"))).toBe("Setup Guide");
    expect(touched?.sort()).toEqual(["guide", "intro"]);
  });

  it("rejects a layer without an identity or with bad overrides", () => {
    const p = boot();
    expect(() => p.apply({ id: "x" } as never)).toThrow(InvalidLayerError);
    expect(() =>
      p.apply({ id: "x", name: "X", documents: { ghost: {} } }),
    ).toThrow(InvalidLayerError);
    expect(() =>
      p.create({
        id: "x",
        name: "X",
        documents: {
          guide: { setup: { children: [{ type: "html", value: "x" }] } },
        },
      }),
    ).toThrow(InvalidLayerError);
  });

  it("create returns the layer and changes nothing", () => {
    const p = boot();
    expect(p.create(french)).toBe(french);
    expect(p.config.patch).toEqual({});
  });
});

describe("events", () => {
  it("unsubscribes, including from inside a listener", () => {
    const p = boot();
    const calls: string[] = [];
    const off = p.on("patch", () => {
      calls.push("a");
      off();
    });
    p.on("patch", () => {
      calls.push("b");
    });
    p.apply(french);
    p.apply(french);
    expect(calls).toEqual(["a", "b", "b"]);
  });

  it("does not emit for a write to the container itself", () => {
    const config = makeConfig();
    const p = boot(config);
    let fired = false;
    p.on("change", () => {
      fired = true;
    });
    config.patch = french;
    expect(fired).toBe(false);
    expect(textOf(p.node("intro", "paragraph[0]"))).toBe("Bienvenue.");
  });

  it("propagates a listener error to the writer", () => {
    const p = boot();
    p.on("patch", () => {
      throw new Error("boom");
    });
    expect(() => p.apply(french)).toThrow("boom");
  });
});

describe("options", () => {
  it("runs the get and set middleware", () => {
    const seen: string[] = [];
    const p = boot(makeConfig(), {
      get: {
        config: {
          patch: (patch) => {
            seen.push("get:patch");
            return patch;
          },
          documents: (documents) => {
            seen.push("get:documents");
            return documents;
          },
        },
      },
      set: {
        config: {
          patch: (patch) => ({ ...patch, name: "Set" }),
          documents: (documents) => {
            seen.push("set:documents");
            return documents;
          },
        },
      },
    });
    p.apply(french);
    expect(p.config.patch.name).toBe("Set");
    p.remove("intro");
    expect(seen).toContain("get:patch");
    expect(seen).toContain("get:documents");
    expect(seen).toContain("set:documents");
  });
});
