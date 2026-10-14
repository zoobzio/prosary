import type { AppProsarySelection } from "../../src/runtime/types";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref, reactive } from "vue";

interface HeadInput {
  htmlAttrs: Record<string, { value: string }>;
}

const headCalls: HeadInput[] = [];
let cookies: Record<string, { value: unknown }>;
const callHook = vi.fn();

vi.mock(
  "#build/prosary/index.mjs",
  () => import("../../src/stubs/build/prosary/index.mjs"),
);
vi.mock(
  "#build/prosary/bundles.mjs",
  () => import("../../src/stubs/build/prosary/bundles.mjs"),
);
vi.mock("../../src/runtime/side", () => ({ onServer: () => false }));

vi.mock("#app", () => ({
  defineNuxtPlugin: (def: unknown) => def,
}));

vi.mock("#imports", () => ({
  useState: (_key: string, init: () => AppProsarySelection) => ref(init()),
  useCookie: (key: string) => (cookies[key] ??= reactive({ value: null })),
  useRequestHeaders: () => ({}),
  useHead: (input: HeadInput) => {
    headCalls.push(input);
  },
}));

import plugin from "../../src/runtime/plugin";

const setup = async () => {
  const result = await plugin.setup({ callHook } as never);
  if (
    !result ||
    typeof result !== "object" ||
    !("provide" in result) ||
    !result.provide
  ) {
    throw new Error("plugin did not provide a service");
  }
  return result.provide as {
    prosary: { config: { locale: string } };
    t: { title: () => string };
    setLocale: (locale: string) => Promise<void>;
  };
};

describe("prosary plugin", () => {
  beforeEach(() => {
    headCalls.length = 0;
    cookies = {};
    callHook.mockClear();
  });

  it("is named prosary", () => {
    expect(plugin.name).toBe("prosary");
  });

  it("provides the service, its resolver and the locale switch", async () => {
    const provide = await setup();
    expect(provide.prosary.config.locale).toBe("en");
    expect(provide.t.title()).toBe("Welcome");
    await provide.setLocale("fr");
    expect(provide.t.title()).toBe("Bienvenue");
  });

  it("mirrors the locale onto the document root, and follows a switch", async () => {
    const provide = await setup();
    const attrs = headCalls[0]?.htmlAttrs;
    expect(attrs?.lang?.value).toBe("en");
    expect(attrs?.dir?.value).toBe("ltr");
    await provide.setLocale("fr");
    expect(attrs?.lang?.value).toBe("fr");
  });

  it("emits prosary:ready with the service", async () => {
    const provide = await setup();
    expect(callHook).toHaveBeenCalledWith("prosary:ready", provide.prosary);
  });
});
