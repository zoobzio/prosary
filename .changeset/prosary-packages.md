---
"prosary": patch
"@prosary/catalog": patch
"@prosary/core": patch
"@prosary/kit": patch
"@prosary/nuxt": patch
"@prosary/schema": patch
"@prosary/translate": patch
---

The translation system publishes under its own names: `prosary` is the
umbrella package, and `@prosary/*` are the runtime, the catalog, the schema,
the build kit, the translator, and the Nuxt module. The CLI is `prosary`, the
config file is `prosary.config.ts`, the Nuxt config key is `prosary`, and the
runtime service is `makeProsary`.
