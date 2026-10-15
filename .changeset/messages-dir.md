---
"@prosary/kit": patch
---

The compiled message bundles are emitted under `messages/<locale>.mjs`, beside
`content/<locale>/`, instead of `locales/<locale>.mjs`. The `bundles` module's
loaders follow, so nothing importing the build changes.
