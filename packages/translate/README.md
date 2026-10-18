# @prosary/translate

LLM translation of ICU messages through the [AI SDK](https://ai-sdk.dev) — the base prompt and options behind `prosary translate`.

## The model

A model is named, as `provider/model`, so a config file imports no SDK:

```ts
translate: { source: "en", targets: ["fr"], model: "anthropic/claude-sonnet-5-5" }
```

| Provider    | Package             | API key                        |
| ----------- | ------------------- | ------------------------------ |
| `anthropic` | `@ai-sdk/anthropic` | `ANTHROPIC_API_KEY`            |
| `openai`    | `@ai-sdk/openai`    | `OPENAI_API_KEY`               |
| `google`    | `@ai-sdk/google`    | `GOOGLE_GENERATIVE_AI_API_KEY` |

The provider's package is an optional peer: install the one you translate with. It is loaded only when a run calls the model, and reads its key from the environment. The listed model ids complete in an editor; any other id a listed provider serves is accepted as written.
