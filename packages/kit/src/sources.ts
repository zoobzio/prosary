import { readdir } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

import type { Origin } from "./chain";
import type { Descriptor } from "./types";
import { InvalidMessagesError } from "./error";
import { normalize } from "./path";
import { readSource } from "./read";

/** The extension of the documents a source directory is read for. */
const EXTENSION = ".json";

/**
 * One file of source messages, and where each locale's translation of it
 * lives.
 */
export interface Chunk {
  /** The absolute path of the source file. */
  path: string;

  /**
   * What the file's keys nest under: `foo.bar.` for `foo/bar.json` in a
   * source directory, empty for a source that is a single file.
   */
  prefix: string;

  /**
   * The file's own keys, as authored and in order — less any a later
   * config declared again, which are that config's now.
   */
  keys: string[];

  /**
   * Whether the file is the project's own, rather than an extended
   * config's. What `prosary translate` writes translations for.
   */
  local: boolean;

  /**
   * The absolute path of a locale's translations of the file:
   * `<translations>/<locale>/<path>` for a file of a source directory,
   * `<translations>/<locale>.json` for a source that is a single file.
   */
  translation: (locale: string) => string;
}

/** The source messages of a project, and the files they were read from. */
export interface Sources {
  /** Every message by its full key, in file then authored order. */
  messages: Record<string, Descriptor>;

  /** The files the messages were read from, sorted by path. */
  chunks: Chunk[];
}

/**
 * Lists the JSON documents under a directory, at any depth, as posix paths
 * relative to it, sorted. `undefined` when the path is not a directory.
 */
const list = async (directory: string): Promise<string[] | undefined> => {
  let entries: string[];
  try {
    entries = await readdir(directory, { recursive: true });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error.code === "ENOTDIR" || error.code === "ENOENT")
    ) {
      return undefined;
    }
    throw error;
  }
  return entries
    .filter((entry) => entry.endsWith(EXTENSION))
    .map(normalize)
    .sort();
};

/** A source file of one config, before it is read. */
type File = Omit<Chunk, "keys">;

/**
 * The source files of one config: the one file, or every `.json` document
 * under the directory, each with where its translations live.
 */
const files = async (origin: Origin): Promise<File[]> => {
  const { root, settings, local } = origin;
  const source = resolve(root, settings.messages);
  const translations = resolve(root, settings.translations);
  const paths = await list(source);
  if (paths === undefined) {
    return [
      {
        path: source,
        prefix: "",
        local,
        translation: (locale: string) => join(translations, `${locale}.json`),
      },
    ];
  }
  return paths.map((path) => ({
    path: join(source, path),
    prefix: `${path.slice(0, -EXTENSION.length).replaceAll("/", ".")}.`,
    local,
    translation: (locale: string) => join(translations, locale, path),
  }));
};

/**
 * Reads the source messages of a chain of configs. A source that is a file
 * is one message-descriptor document, its keys the message keys. A source
 * that is a directory is every `.json` document under it, at any depth,
 * each one's keys nested under its path: `title` in `foo/bar.json` is the
 * message `foo.bar.title`.
 *
 * A dot in a key nests the same way a directory does, so a key may neither
 * be declared twice in one config nor be both a message and a group of
 * messages. Between configs, later wins: a key a later config declares
 * again replaces the earlier message, and leaves the earlier file's chunk.
 *
 * @param origins - The configs, the project's own last.
 * @throws InvalidDocumentError when a file is missing, is not JSON, or an
 * entry is not a descriptor.
 * @throws InvalidMessagesError when the keys do not form a tree.
 */
export const readSources = async (origins: Origin[]): Promise<Sources> => {
  const messages: Record<string, Descriptor> = {};
  const owners: Record<string, { name: string; origin: Origin; chunk: Chunk }> =
    {};
  const chunks: Chunk[] = [];
  const issues: string[] = [];
  for (const origin of origins) {
    for (const file of await files(origin)) {
      const read = await readSource(file.path);
      const path = normalize(relative(origin.root, file.path));
      const name =
        origin.label === undefined ? path : `${path} (${origin.label})`;
      const chunk: Chunk = { ...file, keys: [] };
      for (const [local, descriptor] of Object.entries(read)) {
        const key = `${file.prefix}${local}`;
        if (key.split(".").includes("")) {
          issues.push(
            `${JSON.stringify(key)} (${name}) has an empty segment — a dot separates the groups a message nests under`,
          );
          continue;
        }
        const owner = Object.hasOwn(owners, key) ? owners[key] : undefined;
        if (owner !== undefined && owner.origin === origin) {
          issues.push(
            `${JSON.stringify(key)} is declared in both ${owner.name} and ${name}`,
          );
          continue;
        }
        if (owner !== undefined) {
          // Declared again downstream: the earlier file no longer speaks for it.
          const earlier = key.slice(owner.chunk.prefix.length);
          owner.chunk.keys = owner.chunk.keys.filter((k) => k !== earlier);
        }
        messages[key] = descriptor;
        owners[key] = { name, origin, chunk };
        chunk.keys.push(local);
      }
      chunks.push(chunk);
    }
  }

  for (const key of Object.keys(messages)) {
    const segments = key.split(".");
    for (let depth = 1; depth < segments.length; depth += 1) {
      const group = segments.slice(0, depth).join(".");
      if (Object.hasOwn(messages, group)) {
        issues.push(
          `${JSON.stringify(group)} (${owners[group]?.name}) is both a message and the group of ${JSON.stringify(key)} (${owners[key]?.name})`,
        );
      }
    }
  }

  if (issues.length > 0) {
    throw new InvalidMessagesError(issues);
  }
  return { messages, chunks };
};
