---
"@prosary/nuxt": patch
---

Register `<Prose>` from its runtime file, so Nuxt writes its type against the `.d.ts` beside it. Registered through a module under the build directory, the type pointed at a bare specifier TypeScript could not resolve, and `Prose` was `any` wherever it was imported from `#components`.
