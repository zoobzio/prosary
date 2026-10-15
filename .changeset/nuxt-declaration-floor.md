---
"@prosary/nuxt": patch
---

Require Nuxt 4.5 or later. Earlier hosts wrote the auto-import declarations with the extension stripped, which TypeScript cannot resolve to the `.d.mts` files the build ships, so `useProsary`, the `AppProsary*` types and `<Prose>` were silently `any`.
