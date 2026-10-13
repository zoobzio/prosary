import { describe, expect, it } from "vitest";

import * as core from "@prosary/core";
import * as schema from "@prosary/schema";

import * as root from "../src/index";

/* ESM drops a name that more than one module exports in an `export *` set.
   These tests fail when that happens. */
describe("star-export composition", () => {
  const sources = { core, schema };

  it("keeps the composed packages' runtime exports disjoint", () => {
    const seen = new Map<string, string>();
    for (const [pkg, namespace] of Object.entries(sources)) {
      for (const name of Object.keys(namespace)) {
        expect.soft(seen.get(name), `${name} from ${pkg}`).toBeUndefined();
        seen.set(name, pkg);
      }
    }
  });

  it("re-exports every runtime export of each composed package", () => {
    for (const namespace of Object.values(sources)) {
      for (const name of Object.keys(namespace)) {
        expect.soft(root, name).toHaveProperty(name);
      }
    }
  });
});
