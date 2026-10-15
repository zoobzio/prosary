---
"@prosary/nuxt": patch
---

Ship the module and its runtime as `.js` with `.d.ts` declarations. Nuxt writes the types of `#imports` with the extension stripped, which TypeScript resolves to a `.d.ts` only, so with auto-imports off `useProsary`, `useT`, `useLocale`, `useDocument` and the `AppProsary*` types were `any`. The Nuxt 4.5 floor added for the auto-import case is no longer needed and is removed.
