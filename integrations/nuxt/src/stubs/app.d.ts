// Typecheck-only stub for the Nuxt `#app` virtual module.

/**
 * Runtime hook signatures. Augmented by the prosary runtime via
 * `declare module "#app"`.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- augmented by the runtime
export interface RuntimeNuxtHooks {}

/**
 * The Nuxt app instance. The `$prosary` service is added by the prosary
 * runtime via `declare module "#app"`.
 */
export interface NuxtApp {
  callHook: <K extends keyof RuntimeNuxtHooks>(
    name: K,
    ...args: Parameters<RuntimeNuxtHooks[K]>
  ) => Promise<void>;
  hook: <K extends keyof RuntimeNuxtHooks>(
    name: K,
    fn: RuntimeNuxtHooks[K],
  ) => void;
}

/**
 * A plugin in object form, generic over what it provides, as Nuxt declares
 * it. The generic is what carries the injections into the emitted
 * declaration of the plugin, where Nuxt reads them to type `$t` and the
 * other provided keys in the app.
 */
export interface ObjectPlugin<
  Injections extends Record<string, unknown> = Record<string, unknown>,
> {
  name: string;
  dependsOn?: string[];
  setup: (
    nuxtApp: NuxtApp,
  ) =>
    | void
    | { provide?: Injections }
    | Promise<void | { provide?: Injections }>;
}

/**
 * A plugin, as Nuxt declares it. The stub needs no callable form.
 */
export type Plugin<
  Injections extends Record<string, unknown> = Record<string, unknown>,
> = ObjectPlugin<Injections>;

export declare function defineNuxtPlugin<T extends Record<string, unknown>>(
  plugin: Plugin<T> | ObjectPlugin<T>,
): Plugin<T> & ObjectPlugin<T>;

export declare function useNuxtApp(): NuxtApp;
