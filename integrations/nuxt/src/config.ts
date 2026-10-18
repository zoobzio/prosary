import type { TranslateRunOptions } from "@prosary/kit";

/**
 * The module's configuration. The messages are always authored as FormatJS
 * message descriptors that a `@prosary/kit` config points at; the module
 * takes them one of two ways —
 *
 * - **Built here.** With no `build`, the module loads the app's own
 *   `prosary.config.ts` and builds it through the kit at build time. No
 *   options are needed at all; with `translate`, it translates first.
 * - **Built elsewhere.** Point `build` at the output of a kit build —
 *   a content package in a monorepo, or a published one — and the module
 *   uses it from where it stands:
 *
 *   ```ts
 *   export default defineNuxtConfig({
 *     prosary: { build: "@acme/messages" },
 *   });
 *   ```
 */
export interface NuxtProsaryConfig {
  /**
   * The kit config to build from, relative to the project root. Defaults to
   * `prosary.config.ts`. Ignored when a `build` is passed.
   */
  config?: string;

  /**
   * How to translate: the model — named as `provider/model`, from
   * `@ai-sdk/anthropic`, `@ai-sdk/openai` or `@ai-sdk/google` — its call
   * settings, and the project's instructions, as the kit config's `translate`
   * carries them beside the source and the targets. Present, the module
   * translates before it builds, exactly as `prosary translate` does: what
   * each locale is missing or has out of date is translated and written to
   * the translations directory, and nothing else is touched. Takes the place
   * of the model and the settings in the kit config. Ignored when a `build`
   * is passed, and during `nuxt prepare`.
   */
  translate?: NonNullable<TranslateRunOptions["translate"]>;

  /**
   * A kit build made elsewhere: the output directory `prosary build` wrote.
   * A path — relative to the project root, or absolute — to the directory or
   * its `index.mjs`, or a package whose main entry is that `index.mjs`.
   */
  build?: string;

  /**
   * The overrides: a directory, relative to the source directory (`app/`), of components
   * that render in place of elements and directives. Each `.vue` file at its
   * top level renders the tag or directive its name spells in kebab case:
   * `H2.vue` renders every `h2`, `Callout.vue` every `callout` directive.
   * `<Prose :tree>` renders a document with them. Defaults to
   * `components/prose`.
   */
  components?: string;
}

/**
 * Identity helper that types a Nuxt prosary configuration.
 *
 * @param config - The Nuxt prosary configuration.
 * @returns The same config.
 */
export const defineProsaryConfig = (config: NuxtProsaryConfig) => config;
