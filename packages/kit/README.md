# @prosary/kit

Build kit: enumerated content to per-locale JSON and typed modules.

## Extend

The `extends` option names other kit configs this one builds on: the config
of a package of messages, as the project would import it, or a path relative
to the project root. The kit reads each one's messages, content and named
formats from where that package stands, and builds them into this project's
contract and bundles. An upstream is a source, not a translation: it ships
what it says in the source locale, and the project that extends it
translates that, along with its own, to the locales the project lists.

```ts
export default defineConfig({
  messages: "src/messages",
  extends: "@acme/words/config",
  translate: { source: "en", targets: ["fr", "de"] },
});
```

- **Later wins.** A key, a document or a named format this config declares
  replaces an upstream's; between upstreams, the one listed later wins. A key
  declared twice in one config is still an error.
- **What is inherited is translated here.** `prosary translate` translates an
  upstream's messages and documents into this project's cache, beside its
  own, and the build reads every translation from there. The cache mirrors
  the merged source: an upstream's `brand.json` and this project's translate
  to one `<locale>/brand.json`, and an upstream's `legal.md` to
  `<locale>/legal.md`. The upstream's package is never written to, and
  whatever translations it holds itself are not read.
- **Content** is built with the presets of the config that owns it, in the
  form this config asks for.
- **The chain has no end.** An upstream may extend configs of its own. Every
  config in the chain is written in the same source locale.

A package that can be extended exports its config and ships its sources:

```json
{
  "name": "@acme/words",
  "exports": { ".": "./.dist/index.mjs", "./config": "./prosary.config.ts" },
  "files": [".dist", "prosary.config.ts", "src"]
}
```

The config runs when it is read, so whatever it imports — `@prosary/kit`
for `defineConfig`, `@prosary/parse` for presets — must be resolvable from
the package: list them among its `dependencies` or `peerDependencies`, not
only its `devDependencies`.
