import { describe, it, expect, vi } from "vitest";

const getItem = vi.hoisted(() =>
  vi.fn(async (key: string): Promise<unknown> =>
    key === "fr/guide/start.json" ? { type: "root", children: [] } : null,
  ),
);

vi.mock(
  "#prosary/routes.mjs",
  () => import("../../src/stubs/build/prosary/routes.mjs"),
);

vi.mock("#imports", () => ({
  defineEventHandler: (handler: unknown) => handler,
  useStorage: () => ({ getItem }),
}));

import handler from "../../src/runtime/server/content";

const call = (path: string): Promise<unknown> =>
  (handler as unknown as (event: { path: string }) => Promise<unknown>)({
    path,
  });

describe("the development content middleware", () => {
  it("answers a built document from the mounted directory", async () => {
    await expect(
      call("/i18n/content/fr/guide/start.json?x=1"),
    ).resolves.toEqual({ type: "root", children: [] });
    expect(getItem).toHaveBeenLastCalledWith("fr/guide/start.json");
  });

  it("passes on a document the build does not hold", async () => {
    await expect(call("/i18n/content/fr/blog/post")).resolves.toBeUndefined();
  });

  it("passes on every other request without reading anything", async () => {
    getItem.mockClear();
    await expect(call("/")).resolves.toBeUndefined();
    await expect(call("/i18n/content")).resolves.toBeUndefined();
    await expect(call("/i18n/content/%E0%A4%A")).resolves.toBeUndefined();
    expect(getItem).not.toHaveBeenCalled();
  });
});
