/** What a batch is called in a message: its one key, or how many it holds. */
const subject = (keys: string[]): string => {
  return keys.length === 1
    ? JSON.stringify(keys[0])
    : `${keys.length} messages`;
};

/**
 * Raised when the model declines to translate a batch of messages or a
 * document — the provider's content filter stopped the response. Carries
 * the `keys` of the batch, or the document's path.
 */
export class TranslationRefusedError extends Error {
  readonly keys: string[];

  constructor(keys: string[], options?: ErrorOptions) {
    super(
      `@prosary/translate: the model declined to translate ${subject(keys)}`,
      options,
    );
    this.name = "TranslationRefusedError";
    this.keys = keys;
  }
}

/**
 * Raised when a response ends without a complete answer — it ran out of
 * tokens, or what came back was not the structure asked for. Carries the
 * `keys` of the batch and the `reason` the response stopped.
 */
export class TranslationIncompleteError extends Error {
  readonly keys: string[];
  readonly reason: string;

  constructor(keys: string[], reason: string, options?: ErrorOptions) {
    super(
      `@prosary/translate: the response for ${subject(keys)} was incomplete (${reason}) — lower \`size\` or raise \`maxOutputTokens\``,
      options,
    );
    this.name = "TranslationIncompleteError";
    this.keys = keys;
    this.reason = reason;
  }
}

/**
 * Raised when a model name does not start with a provider this package
 * knows: it must be `provider/model`, with the provider one of
 * {@link PROVIDERS}. Carries the `model` as it was written.
 */
export class UnknownProviderError extends Error {
  readonly model: string;

  constructor(model: string, options?: ErrorOptions) {
    super(
      `@prosary/translate: ${JSON.stringify(model)} does not name a model — write it as provider/model, with the provider one of anthropic, openai, google`,
      options,
    );
    this.name = "UnknownProviderError";
    this.model = model;
  }
}

/**
 * Raised when a model's provider is known but its package cannot be loaded:
 * the AI SDK package that serves it is an optional peer, installed by the
 * projects that translate with it. Carries the `provider` and the name of
 * the `package` to install, and what the import failed with as its `cause`.
 */
export class MissingProviderError extends Error {
  readonly provider: string;
  readonly package: string;

  constructor(provider: string, name: string, options?: ErrorOptions) {
    super(
      `@prosary/translate: translating with ${provider} needs ${name}, which could not be loaded — add it to your devDependencies`,
      options,
    );
    this.name = "MissingProviderError";
    this.provider = provider;
    this.package = name;
  }
}
