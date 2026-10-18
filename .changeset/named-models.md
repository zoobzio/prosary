---
"@prosary/translate": patch
"@prosary/kit": patch
"@prosary/nuxt": patch
---

Name the translation model as a `provider/model` string — `anthropic/claude-sonnet-5-5`, `openai/gpt-5-mini`, `google/gemini-2.5-flash` — in place of a model object from an AI SDK provider. `@prosary/translate` resolves the name, loading the provider's package (`@ai-sdk/anthropic`, `@ai-sdk/openai` or `@ai-sdk/google`, each an optional peer) only when a run calls the model, so a `prosary.config.ts` imports no SDK and the kit's config types carry none. The call settings and provider options are plain data now rather than the SDK's own types.
