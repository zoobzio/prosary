# @prosary/kit

Build kit: enumerated content to per-locale JSON and typed modules.

## Extend

The `extends` option names other kit configs this one builds on: the config
of a package of messages, as the project would import it, or a path relative
to the project root. The kit reads each one's messages, content and named
formats from where that package stands, with that package's own
translations, and builds them into this project's contract and bundles.

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
- **An upstream is read, never written.** `prosary translate` translates only
  this config's own messages and documents. An upstream key the upstream has
  not translated carries the source message, and shows in coverage.
- **A locale the upstream lacks** falls back to the source message, as any
  missing translation does.
- **Content** is built with the presets of the config that owns it, in the
  form this config asks for.
- **The chain has no end.** An upstream may extend configs of its own. Every
  config in the chain is written in the same source locale.

A package that can be extended exports its config and ships its sources:

```json
{
  "name": "@acme/words",
  "exports": { ".": "./.dist/index.mjs", "./config": "./prosary.config.ts" },
  "files": [".dist", "prosary.config.ts", "src", ".i18n"]
}
```

The config runs when it is read, so whatever it imports — `@prosary/kit`
for `defineConfig`, `@prosary/parse` for presets — must be resolvable from
the package: list them among its `dependencies` or `peerDependencies`, not
only its `devDependencies`.
