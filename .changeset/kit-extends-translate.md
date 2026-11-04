---
"@prosary/kit": patch
---

Translate what a config inherits. A config that extends others now translates the upstream's messages and documents along with its own, into its own cache, and the build reads every translation from there: an upstream is a source, not a translation, and its own translations are no longer read. The cache mirrors the merged source — an upstream's `brand.json` and the project's translate to one `<locale>/brand.json` — and the upstream's package is never written to.
