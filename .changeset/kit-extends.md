---
"@prosary/kit": patch
---

Add `extends` to the kit config: other kit configs a project builds on, each named as the project would import it (`@acme/words/config`) or as a path. The kit reads each one's messages, content and named formats from its own package, with its own translations, and builds them into the project's contract and bundles. Later wins — a key, a document or a named format the project declares replaces an upstream's — and `prosary translate` writes only the project's own. An upstream may extend configs of its own; every config in the chain shares the source locale.
