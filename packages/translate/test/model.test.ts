import { describe, expect, it, vi } from "vitest";

import { MissingProviderError, UnknownProviderError } from "../src/error";
import { PROVIDERS, resolveModel } from "../src/model";

describe("resolveModel", () => {
  it("loads each provider's package and asks it for the model by id", async () => {
    await expect(
      resolveModel("anthropic/claude-sonnet-5-5"),
    ).resolves.toMatchObject({
      provider: expect.stringContaining("anthropic"),
      modelId: "claude-sonnet-5-5",
    });
    await expect(resolveModel("openai/gpt-5-mini")).resolves.toMatchObject({
      provider: expect.stringContaining("openai"),
      modelId: "gpt-5-mini",
    });
    await expect(
      resolveModel("google/gemini-2.5-flash"),
    ).resolves.toMatchObject({
      provider: expect.stringContaining("google"),
      modelId: "gemini-2.5-flash",
    });
  });

  it("passes an id it does not list to the provider as written", async () => {
    await expect(resolveModel("anthropic/claude-next")).resolves.toMatchObject({
      modelId: "claude-next",
    });
  });

  it("keeps a slash inside the model id", async () => {
    await expect(
      resolveModel("openai/ft:gpt-4.1/acme/v1"),
    ).resolves.toMatchObject({
      modelId: "ft:gpt-4.1/acme/v1",
    });
  });

  it("throws for a name without a listed provider", async () => {
    for (const name of [
      "mistral/large",
      "claude-sonnet-5-5",
      "anthropic/",
      "",
    ]) {
      const error = await resolveModel(name as "anthropic/x").catch(
        (reason: unknown) => reason,
      );
      expect(error).toBeInstanceOf(UnknownProviderError);
      expect(error).toMatchObject({ model: name });
    }
  });

  it("throws, naming the package, when a provider's package is not installed", async () => {
    const failure = new Error("Cannot find package '@ai-sdk/google'");
    vi.doMock(PROVIDERS.google, () => {
      throw failure;
    });
    try {
      const error = await resolveModel("google/gemini-2.5-flash").catch(
        (reason: unknown) => reason,
      );
      expect(error).toBeInstanceOf(MissingProviderError);
      expect(error).toMatchObject({
        provider: "google",
        package: "@ai-sdk/google",
      });
      expect((error as Error).cause).toBeDefined();
      expect((error as Error).message).toContain("@ai-sdk/google");
    } finally {
      vi.doUnmock(PROVIDERS.google);
    }
  });

  it("throws when a provider's package does not export the provider", async () => {
    vi.doMock(PROVIDERS.openai, () => ({ openai: undefined }));
    try {
      const error = await resolveModel("openai/gpt-5").catch(
        (reason: unknown) => reason,
      );
      expect(error).toBeInstanceOf(MissingProviderError);
      expect(error).toMatchObject({
        provider: "openai",
        package: "@ai-sdk/openai",
      });
    } finally {
      vi.doUnmock(PROVIDERS.openai);
    }
  });
});
