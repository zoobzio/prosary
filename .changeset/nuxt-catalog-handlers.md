---
"@prosary/nuxt": patch
---

Serve content from a catalog. `defineContentHandlers(source)`, auto-imported in the server directory and exported from a `server/routes/i18n/[...path].ts` route, answers the content endpoint from a catalog — a remote service's transport config, or storage callbacks — so `useDocument` and `<Prose>` work for an app whose documents are not built from Markdown. `useDocument` completes the built documents and takes any other path too, which is asked of the endpoint as it stands, so an app may build some documents and take the rest from a catalog. With no content built, an override may name any element.

The content endpoint moves from `/_prosary/content` to `/i18n/content`, and the new `prefix` option mounts it elsewhere. `CONTENT_URL` is no longer exported from `@prosary/nuxt/constant`; `PREFIX` is the default prefix.
