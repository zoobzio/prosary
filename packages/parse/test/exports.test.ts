import { describe, expect, it } from "vitest";

import * as entry from "../src/index";

describe("entry", () => {
  it("exports the runtime API", () => {
    expect(Object.keys(entry).sort()).toEqual([
      "ParseError",
      "defineParser",
      "remarkHeadingId",
      "remarkMatter",
    ]);
  });
});
