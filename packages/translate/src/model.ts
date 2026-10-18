import type { LanguageModel } from "ai";

import { MissingProviderError, UnknownProviderError } from "./error";

/**
 * The providers a model can be named from, each the AI SDK package that
 * serves it. Every one is an optional peer: a project installs the one it
 * translates with, and that package reads its API key from the environment
 * (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`).
 */
export const PROVIDERS = {
  anthropic: "@ai-sdk/anthropic",
  openai: "@ai-sdk/openai",
  google: "@ai-sdk/google",
} as const;

/** A provider a model can be named from. */
export type Provider = keyof typeof PROVIDERS;

/** The Anthropic models a config can name outright. */
export type AnthropicModel =
  | "claude-fable-5-1"
  | "claude-opus-5-5"
  | "claude-sonnet-5-5"
  | "claude-haiku-5-5"
  | "claude-opus-4-6"
  | "claude-sonnet-4-6"
  | "claude-haiku-4-5";

/** The OpenAI models a config can name outright. */
export type OpenAIModel =
  | "gpt-5.5"
  | "gpt-5.4"
  | "gpt-5.4-mini"
  | "gpt-5.4-nano"
  | "gpt-5.1"
  | "gpt-5"
  | "gpt-5-mini"
  | "gpt-5-nano"
  | "gpt-4.1"
  | "gpt-4.1-mini"
  | "gpt-4.1-nano"
  | "gpt-4o"
  | "gpt-4o-mini";

/** The Google models a config can name outright. */
export type GoogleModel =
  | "gemini-3.5-flash"
  | "gemini-3.5-flash-lite"
  | "gemini-3.1-pro-preview"
  | "gemini-3-pro-preview"
  | "gemini-3-flash-preview"
  | "gemini-2.5-pro"
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-lite"
  | "gemini-pro-latest"
  | "gemini-flash-latest"
  | "gemini-flash-lite-latest";

/**
 * A model, named as `provider/model`: the provider it comes from, and the
 * model id that provider knows it by. The listed ids complete in an editor;
 * any other id a listed provider serves is accepted as written, so a model
 * released after this package still names without a cast.
 */
export type Model =
  | `anthropic/${AnthropicModel}`
  | `openai/${OpenAIModel}`
  | `google/${GoogleModel}`
  | `${Provider}/${string}`;

/** Whether a name is one of the providers a model can be named from. */
const isProvider = (name: string): name is Provider => {
  return Object.hasOwn(PROVIDERS, name);
};

/** A provider package's default export: the provider, callable as a model factory. */
type Factory = (id: string) => LanguageModel;

/** Loads a provider's package and returns its model factory. */
const load = async (provider: Provider): Promise<Factory> => {
  const name = PROVIDERS[provider];
  let loaded: unknown;
  try {
    loaded = await import(name);
  } catch (error) {
    throw new MissingProviderError(provider, name, { cause: error });
  }
  const factory = (loaded as Record<string, unknown>)[provider];
  if (typeof factory !== "function") {
    throw new MissingProviderError(provider, name);
  }
  return factory as Factory;
};

/**
 * Resolves a model name to the AI SDK model it names: the provider's package
 * is loaded, and asked for the model by id. Loaded only here, when a run is
 * about to call the model — naming one in a config costs nothing.
 *
 * @param model - The model, as `provider/model`.
 * @returns The model, ready for the SDK.
 * @throws UnknownProviderError when the name does not start with a listed
 * provider.
 * @throws MissingProviderError when the provider's package is not installed.
 */
export const resolveModel = async (model: Model): Promise<LanguageModel> => {
  const slash = model.indexOf("/");
  const provider = slash === -1 ? model : model.slice(0, slash);
  const id = slash === -1 ? "" : model.slice(slash + 1);
  if (!isProvider(provider) || id === "") {
    throw new UnknownProviderError(model);
  }
  const factory = await load(provider);
  return factory(id);
};
