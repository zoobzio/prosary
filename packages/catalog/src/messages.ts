import type { Bundle, Definition, Locale, Schema } from "@prosary/schema";
import type { Client, Entry, MessageCatalog, MessageProvider } from "./types";

import { SchemaError } from "@prosary/schema";

import { ROUTES } from "./constant";
import { MalformedBundleError, MalformedListingError } from "./error";
import { isEntries } from "./util";
import { wire } from "./wire";

/**
 * Creates a {@link MessageCatalog} from storage callbacks — the serving
 * angle, and the machine behind the consuming one: {@link defineMessageClient}
 * compiles its transport config into a {@link MessageProvider} and boots
 * this same factory, so every behavior the two angles share lives here.
 * `list` hands off to the source and proves the answer is a listing of the
 * contract's locales. `get` proves the locale, hands it to the source,
 * treats `null` / `undefined` as a miss, and proves any other answer against
 * the contract before it surfaces. The schema is the only carrier of `D`:
 * the catalog's type is earned through those proofs, never asserted.
 *
 * @param schema - The contract the catalog's bundles are proven against.
 * @param provider - The source callbacks answering the listing and retrievals.
 */
export const defineMessageCatalog = <D extends Definition>(
  schema: Schema<D>,
  provider: MessageProvider,
): MessageCatalog<D> => {
  const list = async (): Promise<Entry<D>[]> => {
    const value: unknown = await provider.list();
    if (!isEntries(schema, value)) {
      throw new MalformedListingError(value, "locale entries");
    }
    return value;
  };

  const get = async (locale: Locale<D>): Promise<Bundle<D> | undefined> => {
    schema.assert.locale(locale);
    const value: unknown = await provider.get(locale);
    if (value === null || value === undefined) {
      return undefined;
    }
    try {
      schema.assert.bundle(value);
    } catch (error) {
      if (error instanceof SchemaError) {
        throw new MalformedBundleError(locale, error.issues);
      }
      throw error;
    }
    return value;
  };

  return { list, get };
};

/**
 * Creates a {@link MessageCatalog} from transport config — the consuming
 * angle, for an app reaching a catalog served elsewhere: its own server's
 * mount point, or a remote translation service. The listing is at
 * `{base}/messages`, a bundle at `{base}/messages/{locale}`. The config
 * compiles into a provider and boots the same machine as the serving angle,
 * so a remote catalog behaves exactly like a local one: same proofs, same
 * miss and failure semantics.
 *
 * @param schema - The contract the catalog's bundles are proven against.
 * @param client - Where to make requests, and what to send with them.
 */
export const defineMessageClient = <D extends Definition>(
  schema: Schema<D>,
  client: Client,
): MessageCatalog<D> => {
  const { list, get } = wire(client, ROUTES.messages);
  return defineMessageCatalog<D>(schema, {
    list,
    get: (locale) => get(locale),
  });
};
