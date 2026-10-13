import { describe, expect, it } from "vitest";

import { SchemaError } from "../src/error";

describe("SchemaError", () => {
  it("keeps the issues and names itself", () => {
    const error = new SchemaError([
      { code: "empty", message: "Name must not be empty." },
    ]);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("SchemaError");
    expect(error.issues).toHaveLength(1);
  });

  it("writes one line per issue with the path as a prefix", () => {
    const error = new SchemaError([
      { code: "empty", message: "A." },
      { code: "not_member", message: "B.", path: ["children", "0"] },
      { code: "not_member", message: "C.", path: [] },
    ]);
    expect(error.message).toBe("A.\nchildren.0: B.\nC.");
  });
});
