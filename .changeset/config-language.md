---
"@prosary/kit": minor
"@prosary/nuxt": minor
---

The config speaks in terms of what it holds. `source` is now `messages`: the
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
