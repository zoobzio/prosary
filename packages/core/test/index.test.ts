import { describe, expect, it } from "vitest";

import * as entry from "../src/index";

/* The scaffold check. Replace it with the package's tests when the first
   export lands. */
describe("entry", () => {
  it("exports nothing yet", () => {
    expect(Object.keys(entry)).toEqual([]);
  });
});
