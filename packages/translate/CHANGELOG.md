# @prosary/translate

## 0.0.7

### Patch Changes

- [`b2bb2d4`](https://github.com/zoobzio/prosary/commit/b2bb2d40bd4b3560a3ef091ac29fbb21147504c5) Thanks [@zoobzio](https://github.com/zoobzio)! - Name the translation model as a `provider/model` string — `anthropic/claude-sonnet-5-5`, `openai/gpt-5-mini`, `google/gemini-2.5-flash` — in place of a model object from an AI SDK provider. `@prosary/translate` resolves the name, loading the provider's package (`@ai-sdk/anthropic`, `@ai-sdk/openai` or `@ai-sdk/google`, each an optional peer) only when a run calls the model, so a `prosary.config.ts` imports no SDK and the kit's config types carry none. The call settings and provider options are plain data now rather than the SDK's own types.

## 0.0.6

## 0.0.5

## 0.0.4

## 0.0.3

## 0.0.2

## 0.0.1

### Patch Changes

- [`858b521`](https://github.com/zoobzio/prosary/commit/858b5212c7385bc73158311ef6eef44c04eba33e) Thanks [@zoobzio](https://github.com/zoobzio)! - The translation system publishes under its own names: `prosary` is the
  umbrella package, and `@prosary/*` are the runtime, the catalog, the schema,
  the build kit, the translator, and the Nuxt module. The CLI is `prosary`, the
  config file is `prosary.config.ts`, the Nuxt config key is `prosary`, and the
  runtime service is `makeProsary`.
