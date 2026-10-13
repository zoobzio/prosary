import { describe, expect, it } from "vitest";

import { SchemaError } from "@prosary/schema";

import { InvalidStyleError, UncoveredKindError } from "../src/error";

describe("errors", () => {
  it("InvalidStyleError extends SchemaError", () => {
    const error = new InvalidStyleError([{ code: "empty", message: "m" }]);
    expect(error).toBeInstanceOf(SchemaError);
    expect(error.name).toBe("InvalidStyleError");
  });

  it("UncoveredKindError names the kinds", () => {
    const error = new UncoveredKindError(["a", "b"]);
    expect(error.kinds).toEqual(["a", "b"]);
    expect(error.message).toContain("a, b");
  });
});
