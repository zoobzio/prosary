import { describe, expect, it } from "vitest";

import { parseReference } from "../src/reference";

describe("parseReference", () => {
  it("parses the three reference forms", () => {
    expect(parseReference("doc:guide#setup")).toEqual({
      document: "guide",
      node: "setup",
    });
    expect(parseReference("doc:guide")).toEqual({ document: "guide" });
    expect(parseReference("#setup")).toEqual({ node: "setup" });
  });

  it("rejects an empty name and any other string", () => {
    expect(parseReference("doc:")).toBeUndefined();
    expect(parseReference("doc:#x")).toBeUndefined();
    expect(parseReference("doc:guide#")).toBeUndefined();
    expect(parseReference("#")).toBeUndefined();
    expect(parseReference("https://x")).toBeUndefined();
    expect(parseReference("guide")).toBeUndefined();
  });
});
