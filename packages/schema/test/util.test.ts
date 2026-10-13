import { describe, expect, it } from "vitest";

import type { Rule } from "../src/types";
import {
  all,
  container,
  each,
  either,
  exhaustive,
  fields,
  filled,
  flag,
  integer,
  isToken,
  list,
  member,
  nest,
  numeric,
  range,
  scheme,
  struct,
  subset,
  superset,
  text,
  token,
  unique,
  url,
} from "../src/util";

/* A rule that passes and a rule that fails with a marker code. */
const pass: Rule = () => undefined;
const fail: Rule = (v) => ({ code: "no_match", message: "nope", received: v });

describe("nest", () => {
  it("prefixes the path of an issue", () => {
    expect(
      nest("outer", { code: "empty", message: "m", path: ["in"] }).path,
    ).toEqual(["outer", "in"]);
    expect(nest("key", { code: "empty", message: "m" }).path).toEqual(["key"]);
  });
});

describe("predicate atoms", () => {
  it("text rejects a non-string", () => {
    expect(text("N")("x")).toBeUndefined();
    expect(text("N")(1)?.code).toBe("not_string");
  });

  it("filled rejects a blank string and ignores a non-string", () => {
    expect(filled("N")("x")).toBeUndefined();
    expect(filled("N")("  ")?.code).toBe("empty");
    expect(filled("N")(1)).toBeUndefined();
  });

  it("member rejects a value outside the set", () => {
    const rule = member("N", new Set(["a", "b"]));
    expect(rule("a")).toBeUndefined();
    expect(rule("c")?.code).toBe("not_member");
    expect(rule(1)?.code).toBe("not_member");
  });

  it("numeric rejects a non-finite number", () => {
    expect(numeric("N")(1.5)).toBeUndefined();
    expect(numeric("N")(Number.NaN)?.code).toBe("not_number");
    expect(numeric("N")("1")?.code).toBe("not_number");
  });

  it("integer rejects a fraction and ignores a non-number", () => {
    expect(integer("N")(2)).toBeUndefined();
    expect(integer("N")(2.5)?.code).toBe("not_integer");
    expect(integer("N")("x")).toBeUndefined();
  });

  it("range checks the inclusive bounds and accepts open bounds", () => {
    expect(range("N", 1, 3)(1)).toBeUndefined();
    expect(range("N", 1, 3)(3)).toBeUndefined();
    expect(range("N", 1, 3)(4)?.code).toBe("out_of_range");
    expect(range("N", undefined, 3)(-100)).toBeUndefined();
    expect(range("N", 1)(0)?.code).toBe("out_of_range");
    expect(range("N", 1, 3)("x")).toBeUndefined();
  });

  it("flag rejects a non-boolean", () => {
    expect(flag("N")(false)).toBeUndefined();
    expect(flag("N")("true")?.code).toBe("not_boolean");
  });

  it("token rejects anything but a braced non-empty name", () => {
    expect(isToken("{a}")).toBe(true);
    expect(token("N")("{color.bg}")).toBeUndefined();
    expect(token("N")("{}")?.code).toBe("not_reference");
    expect(token("N")("color.bg")?.code).toBe("not_reference");
  });

  it("scheme reads a lower-case protocol or none", () => {
    expect(scheme("HTTPS://x")).toBe("https");
    expect(scheme("mailto:a@b")).toBe("mailto");
    expect(scheme("./rel/path")).toBeUndefined();
    expect(scheme("#frag")).toBeUndefined();
  });

  it("url rejects a scheme outside the set and passes a relative URL", () => {
    const rule = url("N", new Set(["https"]));
    expect(rule("https://x")).toBeUndefined();
    expect(rule("/a/b")).toBeUndefined();
    expect(rule("javascript:alert(1)")?.code).toBe("not_url");
    expect(rule(1)).toBeUndefined();
  });

  it("container rejects a non-object and an array", () => {
    expect(container("N")({})).toBeUndefined();
    expect(container("N")([])?.code).toBe("not_object");
    expect(container("N")(null)?.code).toBe("not_object");
  });
});

describe("combinators", () => {
  it("all returns the first issue", () => {
    expect(all([pass, pass])(1)).toBeUndefined();
    expect(all([pass, fail])(1)?.code).toBe("no_match");
  });

  it("either accepts any passing branch", () => {
    expect(either("N", [[fail], [pass]])(1)).toBeUndefined();
    expect(either("N", [[fail], [fail]])(1)?.code).toBe("no_match");
  });

  it("subset and superset check the keys", () => {
    const set = new Set(["a", "b"]);
    expect(subset("N", set)({ a: 1 })).toBeUndefined();
    expect(subset("N", set)({ c: 1 })?.code).toBe("unknown_key");
    expect(superset("N", set)({ a: 1, b: 2 })).toBeUndefined();
    expect(superset("N", set)({ a: 1 })?.path).toEqual(["b"]);
    expect(subset("N", set)(1)).toBeUndefined();
  });

  it("unique rejects a repeated element by deep equality", () => {
    expect(unique("N")(["a", "b"])).toBeUndefined();
    expect(unique("N")(["a", "a"])?.path).toEqual(["1"]);
    expect(unique("N")([{ x: 1 }, { x: 1 }])?.code).toBe("duplicate");
    expect(unique("N")("x")).toBeUndefined();
  });

  it("exhaustive rejects an array that lacks a member", () => {
    const set = new Set(["a", "b"]);
    expect(exhaustive("N", set)(["a", "b"])).toBeUndefined();
    expect(exhaustive("N", set)(["a"])?.code).toBe("not_exhaustive");
  });

  it("list rejects a non-array and nests the index", () => {
    expect(list("N", [pass])([1])).toBeUndefined();
    expect(list("N", [pass])(1)?.code).toBe("not_array");
    expect(list("N", [fail])([1, 2])?.path).toEqual(["0"]);
  });

  it("each nests the key of the failing value", () => {
    expect(each([pass])({ a: 1 })).toBeUndefined();
    expect(each([fail])({ a: 1 })?.path).toEqual(["a"]);
    expect(each([fail])(1)).toBeUndefined();
  });

  it("fields rejects an unknown key and runs the field rules", () => {
    const rule = fields("N", { a: [pass], b: [fail] });
    expect(rule({ a: 1 })).toBeUndefined();
    expect(rule({ c: 1 })?.code).toBe("unknown_key");
    expect(rule({ b: 1 })?.path).toEqual(["b"]);
  });

  it("struct also requires the named keys", () => {
    const rule = struct("N", { a: [pass] }, new Set(["a"]));
    expect(rule({ a: 1 })).toBeUndefined();
    expect(rule({})?.code).toBe("missing_key");
  });
});
