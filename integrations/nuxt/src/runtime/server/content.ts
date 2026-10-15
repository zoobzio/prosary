import {
  createError,
  defineEventHandler,
  getRouterParam,
  useStorage,
} from "#imports";

/**
 * Serves the content documents in development, from the server's own
 * handler. The documents are public assets, which Nitro's dev server serves
 * to the browser from outside the worker — so a page rendered on the server
 * in development, fetching its document from inside the worker, would get a
 * 404. This handler answers that fetch from the same directory, mounted as a
 * server asset. A production build has no need of it: there the static
 * handler serves the assets to every fetch.
 */
export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, "_") ?? "";
  const document = await useStorage("assets:prosary").getItem(path);
  if (document === null) {
    throw createError({ statusCode: 404 });
  }
  return document;
});
