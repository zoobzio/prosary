import { describe, expect, it } from "vitest";

import * as entry from "../src/index";
import * as plugins from "../src/plugins/index";

describe("entry", () => {
  it("exports the runtime API", () => {
    expect(Object.keys(entry).sort()).toEqual(["definePipeline"]);
  });

  it("exports the presets from plugins", () => {
    expect(Object.keys(plugins).sort()).toEqual([
      "directives",
      "gfm",
      "headings",
      "matter",
    ]);
  });
});
