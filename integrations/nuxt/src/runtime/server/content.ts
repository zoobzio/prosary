import { defineEventHandler, useStorage } from "#imports";
import { routes } from "#prosary/routes.mjs";

/**
 * The key of the document a request path asks for, under the content
 * endpoint: `fr/guide/intro.json` of `/i18n/content/fr/guide/intro.json`.
 * `undefined` for a path that is not under the endpoint, or that does not
 * decode.
 */
const keyOf = (path: string): string | undefined => {
  const [pathname = ""] = path.split("?");
  if (!pathname.startsWith(`${routes.content}/`)) {
    return undefined;
  }
  try {
    return decodeURIComponent(pathname.slice(routes.content.length + 1));
  } catch {
    return undefined;
  }
};

/**
 * Serves the built content documents in development, from the server's own
 * middleware. The documents are public assets, which Nitro's dev server
 * serves to the browser from outside the worker — so a page rendered on the
 * server in development, fetching its document from inside the worker, would
 * get a 404. This middleware answers that fetch from the same directory,
 * mounted as a server asset. A request it holds no document for passes on,
 * to a catalog's route if the app has one and to a 404 otherwise. A
 * production build has no need of it: there the static handler serves the
 * assets to every fetch, and passes on the same way.
 */
export default defineEventHandler(async (event) => {
  const key = keyOf(event.path);
  if (key === undefined) {
    return undefined;
  }
  const document = await useStorage("assets:prosary").getItem(key);
  return document ?? undefined;
});
