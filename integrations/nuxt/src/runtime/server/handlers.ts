import type { Client, ContentProvider } from "@prosary/catalog";

import { defineContentCatalog, defineContentClient } from "@prosary/catalog";
import { defineSchema } from "prosary";
import { createError, defineEventHandler } from "#imports";
import { contract } from "#prosary/index.mjs";
import { routes } from "#prosary/routes.mjs";

/**
 * Where the app's content comes from when it is not built from Markdown:
 * the transport config of a service speaking the catalog wire protocol, or
 * the callbacks of a source of any other shape. A catalog made elsewhere is
 * itself such a source, and goes in as it is. Either way it answers what
 * `useDocument` loads: the HTML tree of one document in one locale, by
 * whatever path the source knows it.
 */
export type ProsaryContentSource = Client | ContentProvider;

/** Whether a source is transport config rather than callbacks. */
const isClient = (source: ProsaryContentSource): source is Client => {
  return "base" in source;
};

/**
 * The segments of a request path under the content endpoint, decoded:
 * `["fr", "guide", "intro"]` of `/i18n/content/fr/guide/intro`.
 * `undefined` for a path that is not under the endpoint, or that does not
 * decode.
 */
const segmentsOf = (path: string): string[] | undefined => {
  const [pathname = ""] = path.split("?");
  if (
    pathname !== routes.content &&
    !pathname.startsWith(`${routes.content}/`)
  ) {
    return undefined;
  }
  try {
    return pathname
      .slice(routes.content.length)
      .split("/")
      .filter((segment) => segment !== "")
      .map((segment) => decodeURIComponent(segment));
  } catch {
    return undefined;
  }
};

/**
 * Creates the handler that answers the content endpoints from a catalog,
 * for an app whose content is not built from Markdown: the documents live
 * behind an API, in a database, or anywhere a callback can reach. Exported
 * from a catch-all server route under the module's prefix, `/i18n` unless
 * the config names another — one level above the
 * content endpoint, since a catch-all does not match its own base, where
 * the listing is — it is what `useDocument` fetches from —
 *
 * ```ts
 * // server/routes/i18n/[...path].ts
 * export default defineContentHandlers({ base: "https://cms.example/api" });
 * ```
 *
 * — so the composables and `<Prose>` work as they do over a build. The
 * endpoints are the catalog wire protocol's own: the listing at
 * `/i18n/content`, a document at `/i18n/content/{locale}/{path}`.
 * A locale the contract does not declare and a document the source does not
 * hold are a 404; every answer is proven by the catalog before it is sent.
 *
 * Documents the app does build are static files, served ahead of this
 * handler, which sees only the requests they do not answer.
 *
 * @param source - The source to answer from.
 */
export const defineContentHandlers = (source: ProsaryContentSource) => {
  const schema = defineSchema(contract);
  const content = isClient(source)
    ? defineContentClient(schema, source)
    : defineContentCatalog(schema, source);

  return defineEventHandler(async (event) => {
    const segments = segmentsOf(event.path);
    if (segments === undefined) {
      throw createError({ statusCode: 404 });
    }
    const [locale, ...rest] = segments;
    if (locale === undefined) {
      return content.list();
    }
    if (!schema.check.locale(locale) || rest.length === 0) {
      throw createError({ statusCode: 404 });
    }
    const document = await content.get(locale, rest.join("/"));
    if (document === undefined) {
      throw createError({ statusCode: 404 });
    }
    return document;
  });
};
