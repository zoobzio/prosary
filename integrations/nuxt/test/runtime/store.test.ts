import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref, reactive, type Ref } from "vue";

let states: Record<string, Ref<unknown>>;
let cookies: Record<string, { value: unknown }>;

vi.mock(
  "#build/prosary/index.mjs",
  () => import("../../src/stubs/build/prosary/index.mjs"),
);

vi.mock("#imports", () => ({
  useState: (key: string, init: () => unknown) => (states[key] ??= ref(init())),
  useCookie: (key: string) => (cookies[key] ??= reactive({ value: null })),
}));

import { accessProsary } from "../../src/runtime/store";

describe("accessProsary", () => {
  beforeEach(() => {
    states = {};
    cookies = {};
  });

  it("seeds the selection with the source locale, and nothing else", () => {
    const store = accessProsary();
    expect(store.selection.value).toEqual({ locale: "en" });
    expect(Object.keys(states)).toEqual(["prosary:selection"]);
  });

  it("shares one selection between callers", () => {
    accessProsary().selection.value.locale = "fr";
    expect(accessProsary().selection.value.locale).toBe("fr");
  });

  it("keeps the selection in three cookies", () => {
    accessProsary();
    expect(Object.keys(cookies)).toEqual([
      "prosary-locale",
      "prosary-time-zone",
      "prosary-convention",
    ]);
  });
});
