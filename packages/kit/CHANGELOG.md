# @prosary/kit

## 0.0.5

### Patch Changes

- Updated dependencies []:
  - @prosary/parse@0.0.5
  - @prosary/schema@0.0.5
  - @prosary/translate@0.0.5

## 0.0.4

### Patch Changes

- Updated dependencies []:
  - @prosary/parse@0.0.4
  - @prosary/schema@0.0.4
  - @prosary/translate@0.0.4

## 0.0.3

### Patch Changes

- Updated dependencies []:
  - @prosary/parse@0.0.3
  - @prosary/schema@0.0.3
  - @prosary/translate@0.0.3

## 0.0.2

### Patch Changes

- Updated dependencies [[`dcd01cc`](https://github.com/zoobzio/prosary/commit/dcd01cc28178db7216b7614eaecdfcc085cc97d2)]:
  - @prosary/parse@0.0.2
  - @prosary/schema@0.0.2
  - @prosary/translate@0.0.2

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

- [`43a9fc8`](https://github.com/zoobzio/prosary/commit/43a9fc8fb0a77e6b182f31afe00814db1095527b) Thanks [@zoobzio](https://github.com/zoobzio)! - The content documents build in a form the config chooses. `content` takes an
  object as well as a directory: `{ dir, output }`, where `output` is `md` for
  the Markdown as written, `mdast` for the Markdown syntax tree as JSON, `hast`
  for the HTML syntax tree as JSON, or `html` for an HTML string. The trees
  carry the frontmatter on their root and no positions. The built file takes
  the extension of its form. The default is `hast`.

- [`9602b21`](https://github.com/zoobzio/prosary/commit/9602b21a1ed3069e22d2ca4d3c5c6376f81fc516) Thanks [@zoobzio](https://github.com/zoobzio)! - The generated contract module records the form the content was built in, as
  `content.output`.

  The Nuxt module serves content built as `hast` only. It refuses a build in
  another form, its own or one it adopts, with a message that names the fix.
  `useDocument` fetches the document's JSON and resolves the HTML syntax tree
  for the active locale, typed as a hast `Root`, which is what the module will
  render with component substitution.

- [`8e4a022`](https://github.com/zoobzio/prosary/commit/8e4a02267b0b10763cd9006d1da5fb406effea85) Thanks [@zoobzio](https://github.com/zoobzio)! - The compiled message bundles are emitted under `messages/<locale>.mjs`, beside
  `content/<locale>/`, instead of `locales/<locale>.mjs`. The `bundles` module's
  loaders follow, so nothing importing the build changes.

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
- Updated dependencies [[`43a9fc8`](https://github.com/zoobzio/prosary/commit/43a9fc8fb0a77e6b182f31afe00814db1095527b), [`33994f9`](https://github.com/zoobzio/prosary/commit/33994f96e2c08a1b7b57a57fd9b37b354c1c7c94), [`858b521`](https://github.com/zoobzio/prosary/commit/858b5212c7385bc73158311ef6eef44c04eba33e)]:
  - @prosary/parse@0.0.1
  - @prosary/schema@0.0.1
  - @prosary/translate@0.0.1
