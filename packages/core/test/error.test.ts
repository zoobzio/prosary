import { describe, expect, it } from "vitest";

import { SchemaError } from "@prosary/schema";

import {
  InvalidDocumentError,
  InvalidLayerError,
  InvalidPatchError,
  UnknownDocumentError,
  reframe,
} from "../src/error";

const issues = [{ code: "empty" as const, message: "Name must not be empty." }];

describe("semantic errors", () => {
  it("extend SchemaError and carry the issues", () => {
    for (const Semantic of [
      InvalidDocumentError,
      InvalidLayerError,
      InvalidPatchError,
    ]) {
      const error = new Semantic(issues);
      expect(error).toBeInstanceOf(SchemaError);
      expect(error.name).toBe(Semantic.name);
      expect(error.issues).toBe(issues);
    }
  });

  it("UnknownDocumentError names the id", () => {
    const error = new UnknownDocumentError("ghost");
    expect(error.id).toBe("ghost");
    expect(error.message).toContain("ghost");
  });
});

describe("reframe", () => {
  it("rethrows a SchemaError as the semantic error", () => {
    expect(() =>
      reframe(InvalidLayerError, () => {
        throw new SchemaError(issues);
      }),
    ).toThrow(InvalidLayerError);
  });

  it("passes other errors and the result through", () => {
    expect(() =>
      reframe(InvalidLayerError, () => {
        throw new TypeError("x");
      }),
    ).toThrow(TypeError);
    expect(reframe(InvalidLayerError, () => 1)).toBe(1);
  });
});
