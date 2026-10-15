---
"@prosary/nuxt": patch
---

The module's auto-imports are typed in the app again. The module registered
its runtime files by paths without an extension, and the build emits them as
`.mjs` with `.d.mts` declarations, which TypeScript follows only with the
extension: the declarations Nuxt wrote for `useProsary`, `useT`, `useLocale`,
`useDocument`, `<Prose>` and the `AppProsary*` types named a module it could
not find, and each was silently `any`. A message key that does not exist, or
values that are not a message's own, passed `nuxt typecheck`. The module now
resolves each runtime file to the file it is, so Nuxt writes the path of its
declaration.
