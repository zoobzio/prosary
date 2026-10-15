import type { Root } from "hast";
import type { Definition, Locale, Schema } from "@prosary/schema";
import type { Client, ContentCatalog, ContentProvider } from "./types";

import { ROUTES } from "./constant";
import { MalformedDocumentError, MalformedListingError } from "./error";
import { isPaths, isTree } from "./util";
import { wire } from "./wire";

/**
 * Creates a {@link ContentCatalog} from storage callbacks — the serving
 * angle, and the machine behind {@link defineContentClient}. `list` hands
 * off to the source and proves the answer is a list of paths. `get` proves
 * the locale against the contract, hands it and the path to the source,
 * treats `null` / `undefined` as a miss, and proves any other answer is an
 * HTML tree before it surfaces.
 *
 * @param schema - The contract the locales are proven against.
 * @param provider - The source callbacks answering the listing and retrievals.
 */
export const defineContentCatalog = <D extends Definition>(
  schema: Schema<D>,
  provider: ContentProvider,
): ContentCatalog<D> => {
  const list = async (): Promise<string[]> => {
    const value: unknown = await provider.list();
    if (!isPaths(value)) {
      throw new MalformedListingError(value, "document paths");
    }
    return value;
  };

  const get = async (
    locale: Locale<D>,
    path: string,
  ): Promise<Root | undefined> => {
    schema.assert.locale(locale);
    const value: unknown = await provider.get(locale, path);
    if (value === null || value === undefined) {
      return undefined;
    }
    if (!isTree(value)) {
      throw new MalformedDocumentError(locale, path, value);
    }
    return value;
  };

  return { list, get };
};

/**
 * Creates a {@link ContentCatalog} from transport config — the consuming
 * angle. The listing is at `{base}/content`, a document at
 * `{base}/content/{locale}/{path}`, the path's segments each encoded.
 *
 * @param schema - The contract the locales are proven against.
 * @param client - Where to make requests, and what to send with them.
 */
export const defineContentClient = <D extends Definition>(
  schema: Schema<D>,
  client: Client,
): ContentCatalog<D> => {
  const { list, get } = wire(client, ROUTES.content);
  return defineContentCatalog<D>(schema, {
    list,
    get: (locale, path) => get(locale, ...path.split("/")),
  });
};
