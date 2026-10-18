# @prosary/nuxt

## 0.0.7

### Patch Changes

- [`b2bb2d4`](https://github.com/zoobzio/prosary/commit/b2bb2d40bd4b3560a3ef091ac29fbb21147504c5) Thanks [@zoobzio](https://github.com/zoobzio)! - Name the translation model as a `provider/model` string — `anthropic/claude-sonnet-5-5`, `openai/gpt-5-mini`, `google/gemini-2.5-flash` — in place of a model object from an AI SDK provider. `@prosary/translate` resolves the name, loading the provider's package (`@ai-sdk/anthropic`, `@ai-sdk/openai` or `@ai-sdk/google`, each an optional peer) only when a run calls the model, so a `prosary.config.ts` imports no SDK and the kit's config types carry none. The call settings and provider options are plain data now rather than the SDK's own types.

- Updated dependencies [[`b2bb2d4`](https://github.com/zoobzio/prosary/commit/b2bb2d40bd4b3560a3ef091ac29fbb21147504c5)]:
  - @prosary/kit@0.0.7
  - prosary@0.0.7
  - @prosary/vue@0.0.7

## 0.0.6

### Patch Changes

- Updated dependencies [[`3b59564`](https://github.com/zoobzio/prosary/commit/3b5956461af8df5b9af9f51cfaa26a2481878219)]:
  - @prosary/kit@0.0.6
  - prosary@0.0.6
  - @prosary/vue@0.0.6

## 0.0.5

### Patch Changes

- [`230a187`](https://github.com/zoobzio/prosary/commit/230a187f7d1afa64a22f7682153d722445564a23) Thanks [@zoobzio](https://github.com/zoobzio)! - Register `<Prose>` from its runtime file, so Nuxt writes its type against the `.d.ts` beside it. Registered through a module under the build directory, the type pointed at a bare specifier TypeScript could not resolve, and `Prose` was `any` wherever it was imported from `#components`.

- Updated dependencies []:
  - prosary@0.0.5
  - @prosary/kit@0.0.5
  - @prosary/vue@0.0.5

## 0.0.4

### Patch Changes

- [`264574a`](https://github.com/zoobzio/prosary/commit/264574a8d8b6aef42fc11961eb0d9086a45aae7d) Thanks [@zoobzio](https://github.com/zoobzio)! - Ship the module and its runtime as `.js` with `.d.ts` declarations. Nuxt writes the types of `#imports` with the extension stripped, which TypeScript resolves to a `.d.ts` only, so with auto-imports off `useProsary`, `useT`, `useLocale`, `useDocument` and the `AppProsary*` types were `any`. The Nuxt 4.5 floor added for the auto-import case is no longer needed and is removed.

- Updated dependencies []:
  - prosary@0.0.4
  - @prosary/kit@0.0.4
  - @prosary/vue@0.0.4

## 0.0.3

### Patch Changes

- [`3b8c3a7`](https://github.com/zoobzio/prosary/commit/3b8c3a745df16df81a0f774dfe21e073247140aa) Thanks [@zoobzio](https://github.com/zoobzio)! - Require Nuxt 4.5 or later. Earlier hosts wrote the auto-import declarations with the extension stripped, which TypeScript cannot resolve to the `.d.mts` files the build ships, so `useProsary`, the `AppProsary*` types and `<Prose>` were silently `any`.

- Updated dependencies []:
  - prosary@0.0.3
  - @prosary/kit@0.0.3
  - @prosary/vue@0.0.3

## 0.0.2

### Patch Changes

- Updated dependencies []:
  - @prosary/kit@0.0.2
  - prosary@0.0.2
  - @prosary/vue@0.0.2

## 0.0.1

### Patch Changes

- [`43a9fc8`](https://github.com/zoobzio/prosary/commit/43a9fc8fb0a77e6b182f31afe00814db1095527b) Thanks [@zoobzio](https://github.com/zoobzio)! - The config speaks in terms of what it holds. `source` is now `messages`: the
  path of the source messages. The locales sit in `translate`, next to the
  model: `translate.source` is the locale the source is written in and
  `translate.targets` are the locales it is translated to. `translate` is
  always present; the model and its settings remain optional, needed only to
  translate.
  `translations` is now `translate.cache`: the directory the translations are
  cached in, written by `prosary translate` and read by the build.

  ```ts
  export default defineConfig({
    messages: "messages",
    translate: { source: "en", targets: ["fr", "de"], cache: ".i18n" },
  });
  ```

  The Nuxt module's `translate` option is unchanged in shape: the model and
  its settings, which it passes to the kit for the run.

- [`87e2158`](https://github.com/zoobzio/prosary/commit/87e215896835a7812900fa2a31a53b1479e0328f) Thanks [@zoobzio](https://github.com/zoobzio)! - In development, a page rendered on the server now finds its content
  documents. Nitro serves public assets from outside its worker in dev, so the
  server's own fetch of a document got a 404 and the page rendered without it
  until the locale changed. The module now also serves the content directory
  from a handler of its own in development, and the public asset entry falls
  through to it.

- [`9602b21`](https://github.com/zoobzio/prosary/commit/9602b21a1ed3069e22d2ca4d3c5c6376f81fc516) Thanks [@zoobzio](https://github.com/zoobzio)! - The generated contract module records the form the content was built in, as
  `content.output`.

  The Nuxt module serves content built as `hast` only. It refuses a build in
  another form, its own or one it adopts, with a message that names the fix.
  `useDocument` fetches the document's JSON and resolves the HTML syntax tree
  for the active locale, typed as a hast `Root`, which is what the module will
  render with component substitution.

- [`1bd7bd0`](https://github.com/zoobzio/prosary/commit/1bd7bd0fef46596d8d3d7f3b327394044253085b) Thanks [@zoobzio](https://github.com/zoobzio)! - The module's auto-imports are typed in the app again. The module registered
  its runtime files by paths without an extension, and the build emits them as
  `.mjs` with `.d.mts` declarations, which TypeScript follows only with the
  extension: the declarations Nuxt wrote for `useProsary`, `useT`, `useLocale`,
  `useDocument`, `<Prose>` and the `AppProsary*` types named a module it could
  not find, and each was silently `any`. A message key that does not exist, or
  values that are not a message's own, passed `nuxt typecheck`. The module now
  resolves each runtime file to the file it is, so Nuxt writes the path of its
  declaration.

- [`33994f9`](https://github.com/zoobzio/prosary/commit/33994f96e2c08a1b7b57a57fd9b37b354c1c7c94) Thanks [@zoobzio](https://github.com/zoobzio)! - `@prosary/parse` is the Markdown pipeline: `definePipeline({ presets })` runs
  remark-parse, the `remark` plugins of each preset, remark-rehype, and the
  `rehype` plugins of each preset, with a stop at the Markdown tree (`parse`)
  and the HTML tree (`build`). With no presets it reads CommonMark and builds
  HTML nodes, nothing more. A preset is `{ remark?, rehype? }`, each a unified
  plugin list.

  The syntax the parser used to hardwire is now four presets exported from
  `@prosary/parse/plugins`: `gfm`, `matter` (frontmatter onto `data.matter` of both
  roots), `headings` (`{#id}` to the element's `id`), and `directives` (each
  directive a `div` or `span` carrying `data-directive="name"` and its
  attributes as data attributes).

  The kit config's `content` takes `presets`, applied in order; a config that
  lists none builds plain CommonMark. The generated module enumerates what the
  content built to: `Element` and `elements` (every tag name), `Directive` and
  `directives` (every directive name), and `content.marker`, the property that
  names a directive on its element.

- [`858b521`](https://github.com/zoobzio/prosary/commit/858b5212c7385bc73158311ef6eef44c04eba33e) Thanks [@zoobzio](https://github.com/zoobzio)! - The translation system publishes under its own names: `prosary` is the
  umbrella package, and `@prosary/*` are the runtime, the catalog, the schema,
  the build kit, the translator, and the Nuxt module. The CLI is `prosary`, the
  config file is `prosary.config.ts`, the Nuxt config key is `prosary`, and the
  runtime service is `makeProsary`.

- [`4e3c058`](https://github.com/zoobzio/prosary/commit/4e3c058ece00b6fbd980a0d8b1d1a2da845b700c) Thanks [@zoobzio](https://github.com/zoobzio)! - `<Prose :tree>` renders a content document through `@prosary/vue` with
  the app's overrides: the `.vue` files at the top level of `app/components/prose`
  (or the directory the `components` option names, relative to `app/`), each rendering the tag or
  directive its file name spells in kebab case. The module builds the component
  map at build time and types it against the elements and directives the
  content builds, so an override nothing renders fails `nuxt typecheck`.
- Updated dependencies [[`19b4ba1`](https://github.com/zoobzio/prosary/commit/19b4ba18dec825983c3f87c67ace6359dd6ab65a), [`43a9fc8`](https://github.com/zoobzio/prosary/commit/43a9fc8fb0a77e6b182f31afe00814db1095527b), [`43a9fc8`](https://github.com/zoobzio/prosary/commit/43a9fc8fb0a77e6b182f31afe00814db1095527b), [`9602b21`](https://github.com/zoobzio/prosary/commit/9602b21a1ed3069e22d2ca4d3c5c6376f81fc516), [`8e4a022`](https://github.com/zoobzio/prosary/commit/8e4a02267b0b10763cd9006d1da5fb406effea85), [`33994f9`](https://github.com/zoobzio/prosary/commit/33994f96e2c08a1b7b57a57fd9b37b354c1c7c94), [`858b521`](https://github.com/zoobzio/prosary/commit/858b5212c7385bc73158311ef6eef44c04eba33e), [`4e3c058`](https://github.com/zoobzio/prosary/commit/4e3c058ece00b6fbd980a0d8b1d1a2da845b700c)]:
  - prosary@0.0.1
  - @prosary/kit@0.0.1
  - @prosary/vue@0.0.1
