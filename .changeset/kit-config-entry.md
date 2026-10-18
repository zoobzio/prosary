---
"@prosary/kit": patch
---

Add a `@prosary/kit/config` entry that exports `defineConfig` alone, with no
runtime imports, and mark the package side-effect free. A `prosary.config.ts`
that imports it can be exported from a content package and loaded by a
consumer without pulling the kit into its graph. `defineConfig` now keeps the
literal type of the config it is given, so `config.content` can be passed
straight to `definePipeline`.
