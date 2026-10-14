import type { Contract, Document } from "#build/prosary/index.mjs";
import type {
  Bundle,
  Config,
  Prosary,
  Key,
  Locale,
  Message,
  Resolver,
} from "prosary";

/**
 * The active contract: the `Contract` the build-time `index` module declares
 * over its locales, messages and formats.
 */
export type AppProsaryContract = Contract;

/**
 * A locale the app is built for.
 */
export type AppProsaryLocale = Locale<AppProsaryContract>;

/**
 * The key of a message of the app.
 */
export type AppProsaryKey = Key<AppProsaryContract>;

/**
 * A message of the app — its key, with the values it takes when it takes
 * any — as data a component can be handed and resolve: `$t(message)`.
 */
export type AppProsaryMessage = Message<AppProsaryContract>;

/**
 * A content document the app is built with, by its path.
 */
export type AppProsaryDocument = Document;

/**
 * One locale's compiled messages.
 */
export type AppProsaryBundle = Bundle<AppProsaryContract>;

/**
 * The caller-owned state container the service operates on.
 */
export type AppProsaryConfig = Config<AppProsaryContract>;

/**
 * The runtime translation service bound to the app's contract.
 */
export type AppProsary = Prosary<AppProsaryContract>;

/**
 * The app's messages as functions: what `$t` is.
 */
export type AppProsaryResolver = Resolver<AppProsaryContract>;

/**
 * What a visitor has chosen, and what travels from the server render to the
 * browser: the locale, and how values are formatted. The messages do not —
 * each side loads the locale's bundle itself.
 */
export interface AppProsarySelection {
  locale: AppProsaryLocale;
  timeZone?: string | undefined;
  convention?: string | undefined;
}

/**
 * Switches the app to a locale: loads its bundle, then applies both in one
 * step. Of calls that overlap, the last one made wins.
 */
export type SetLocale = (locale: AppProsaryLocale) => Promise<void>;

/**
 * The runtime hooks the service emits, keyed by event name. Shared between the
 * `#app` augmentation and {@link ProsaryNuxtApp} so the two never drift.
 */
export interface ProsaryHooks {
  "prosary:ready": (service: AppProsary) => void;
  "prosary:locale": (locale: AppProsaryLocale) => void;
}

/**
 * The minimal `nuxtApp` surface the instrumentation needs. Typing against this
 * instead of `NuxtApp` keeps `makeProsary` off the `NuxtApp.$prosary` →
 * `AppProsary` → `makeProsary` cycle that otherwise makes the augmentation
 * recursive.
 */
export interface ProsaryNuxtApp {
  callHook<H extends keyof ProsaryHooks>(
    name: H,
    ...args: Parameters<ProsaryHooks[H]>
  ): unknown;
}

declare module "#app" {
  interface NuxtApp {
    $prosary: AppProsary;
    $t: AppProsaryResolver;
    $setLocale: SetLocale;
  }

  // Declaration merging: fold the shared hook map into Nuxt's runtime hooks.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface RuntimeNuxtHooks extends ProsaryHooks {}
}
