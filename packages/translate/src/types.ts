import type { Model } from "./model";

/** A JSON value: what a provider option can hold. */
export type JsonValue =
  | null
  | string
  | number
  | boolean
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

/**
 * The call settings handed to the AI SDK as they are: the subset of its
 * own `CallSettings` that is plain data, so a config file can carry them
 * without importing the SDK.
 */
export interface Settings {
  /** The most tokens a response may hold. */
  maxOutputTokens?: number;

  /** The sampling temperature; `0` is the most deterministic. */
  temperature?: number;

  /** Nucleus sampling: the probability mass to sample from. */
  topP?: number;

  /** The number of top tokens to sample from. */
  topK?: number;

  /** How much a token already present in the response is discouraged. */
  presencePenalty?: number;

  /** How much a token's repetition is discouraged. */
  frequencyPenalty?: number;

  /** Sequences that end the response when generated. */
  stopSequences?: string[];

  /** A seed for deterministic sampling, where the provider supports one. */
  seed?: number;

  /** How many times a failed request is retried. The SDK's default is 2. */
  maxRetries?: number;

  /** Extra HTTP headers sent with every request. */
  headers?: Record<string, string | undefined>;
}

/**
 * How a translation runs: the model, named as `provider/model`, the call
 * settings and provider options the SDK takes as they are, and the two
 * options of this package's making, `instructions` and `size`. Plain data
 * throughout, so a `prosary.config.ts` carries it without importing a
 * model or its SDK.
 */
export interface TranslateOptions extends Settings {
  /**
   * The model that translates, as `provider/model` —
   * `anthropic/claude-sonnet-5-5`, `openai/gpt-5-mini`,
   * `google/gemini-2.5-flash`. The provider's AI SDK package
   * (`@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`) must be
   * installed, and reads its API key from the environment.
   */
  model: Model;

  /**
   * Options passed through to the provider, by provider name — reasoning
   * effort, service tier, whatever the provider's own package documents.
   */
  providerOptions?: Record<string, Record<string, JsonValue>>;

  /**
   * The project's own guidance, added to the base prompt: a glossary, the
   * tone to take, who the audience is, terms never to translate.
   */
  instructions?: string;

  /**
   * How many messages one request carries. Smaller requests fail and retry
   * more cheaply; larger ones give the model more context. Defaults to 50.
   * A document always goes out whole.
   */
  size?: number;
}

/** One message to translate. */
export interface Source {
  /** The ICU message in the source locale. */
  message: string;

  /** What the message is for, when its author said. */
  description?: string;
}

/** A set of messages to take from one locale to another. */
export interface TranslateRequest {
  /** The locale the messages are written in. */
  source: string;

  /** The locale to translate them to. */
  target: string;

  /** The messages, by key. */
  messages: Record<string, Source>;
}

/**
 * Translates a set of messages. Resolves the translations by key: a key the
 * model did not answer for is absent, and the caller decides what a
 * translation is worth — whether it parses, whether it fits its source.
 */
export type Translate = (
  request: TranslateRequest,
  options: TranslateOptions,
) => Promise<Record<string, string>>;

/** One Markdown document to take from one locale to another. */
export interface DocumentRequest {
  /** The locale the document is written in. */
  source: string;

  /** The locale to translate it to. */
  target: string;

  /** The document's path, to name it in errors. */
  path: string;

  /** The Markdown document in the source locale, as it stands now. */
  document: string;

  /**
   * The translation the target locale already has, made from an earlier
   * version of the source. Given, the translation is brought up to date
   * rather than redone: wording that still holds is kept.
   */
  previous?: string;
}

/**
 * Translates one Markdown document, or updates its existing translation.
 * The caller decides what the result is worth — whether its structure
 * survived.
 */
export type TranslateDocument = (
  request: DocumentRequest,
  options: TranslateOptions,
) => Promise<string>;
