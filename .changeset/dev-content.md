---
"@prosary/nuxt": patch
---

In development, a page rendered on the server now finds its content
documents. Nitro serves public assets from outside its worker in dev, so the
server's own fetch of a document got a 404 and the page rendered without it
until the locale changed. The module now also serves the content directory
from a handler of its own in development, and the public asset entry falls
through to it.
