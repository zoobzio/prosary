import { existsSync } from "node:fs";

import { createJiti } from "jiti";
import { record } from "objectively";

import type { KitConfig } from "./types";
import { MalformedConfigError, MissingConfigError } from "./error";

/**
 * Whether a value has the outer shape of a {@link KitConfig}: a plain record
 * whose `messages` is a string and whose `translate` names a `source`. A shape test only — whether the
 * members satisfy the kit's rules is {@link validate}'s concern.
 */
const isConfig = (value: unknown): value is KitConfig => {
  if (!record(value)) {
    return false;
  }
  return (
    typeof value.messages === "string" &&
    record(value.translate) &&
    typeof value.translate.source === "string"
  );
};

/**
 * Loads a `prosary.config.ts` — or any TypeScript / JavaScript config file —
 * through jiti and returns its default export. Only the outer shape is checked
 * here; {@link resolveKit} validates the rest. An error thrown while the file
 * itself runs propagates untouched.
 *
 * @param path - The absolute path to the config file.
 * @throws MissingConfigError when there is no file at `path`.
 * @throws MalformedConfigError when the default export is not config-shaped.
 */
export const loadConfig = async (path: string): Promise<KitConfig> => {
  if (!existsSync(path)) {
    throw new MissingConfigError(path);
  }
  const jiti = createJiti(import.meta.url, { moduleCache: false });
  const config = await jiti.import<unknown>(path, { default: true });
  if (!isConfig(config)) {
    throw new MalformedConfigError(path);
  }
  return config;
};
