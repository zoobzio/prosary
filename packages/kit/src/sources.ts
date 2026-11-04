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
 * One file of translations, and the source files it translates: the file
 * at one path of the source, from every config of the chain that has one.
 * `brand.json` of an upstream and `brand.json` of the project are one
 * chunk — their keys nest under the same prefix, and translate to one file.
 */
export interface Chunk {
  /**
   * The absolute paths of the source files, in chain order: an upstream's
   * before the project's own.
   */
  sources: string[];

  /**
   * What the keys nest under: `foo.bar.` for `foo/bar.json` in a source
   * directory, empty for a source that is a single file.
   */
  prefix: string;

  /**
   * The keys, as authored and in order — each one's, less any a later
   * config declared again, which follow as that config's.
   */
  keys: string[];

  /**
   * The absolute path of a locale's translations of the chunk, in the
   * project's own cache: `<translations>/<locale>/<path>` for a file of a
   * source directory, `<translations>/<locale>.json` for a source that is a
   * single file.
   */
  translation: (locale: string) => string;
}

/** The source messages of a project, and the files they were read from. */
export interface Sources {
  /** Every message by its full key, in file then authored order. */
  messages: Record<string, Descriptor>;

  /**
   * The translation files the messages belong to, in the order they were
   * first met: each config's files sorted by path, upstreams first.
   */
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
interface File {
  /** The absolute path of the source file. */
  path: string;

  /** What the file's keys nest under. */
  prefix: string;

  /** Where a locale's translations of the file live. */
  translation: (locale: string) => string;
}

/**
 * The source files of one config: the one file, or every `.json` document
 * under the directory, each with where its translations live.
 *
 * @param origin - The config.
 * @param translations - The absolute directory of the project's translations.
 */
const files = async (origin: Origin, translations: string): Promise<File[]> => {
  const source = resolve(origin.root, origin.settings.messages);
  const paths = await list(source);
  if (paths === undefined) {
    return [
      {
        path: source,
        prefix: "",
        translation: (locale: string) => join(translations, `${locale}.json`),
      },
    ];
  }
  return paths.map((path) => ({
    path: join(source, path),
    prefix: `${path.slice(0, -EXTENSION.length).replaceAll("/", ".")}.`,
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
 * again replaces the earlier message, and is that config's now.
 *
 * Every translation lives in the project's own cache, an upstream's
 * included — a config that extends others translates what it inherits. The
 * translations mirror the merged source, so the files of two configs at one
 * path form one chunk, translated to one file.
 *
 * @param origins - The configs, the project's own last.
 * @throws InvalidDocumentError when a file is missing, is not JSON, or an
 * entry is not a descriptor.
 * @throws InvalidMessagesError when the keys do not form a tree.
 */
export const readSources = async (origins: Origin[]): Promise<Sources> => {
  const project = origins[origins.length - 1] as Origin;
  const translations = resolve(project.root, project.settings.translations);
  const messages: Record<string, Descriptor> = {};
  const owners: Record<string, { name: string; origin: Origin; chunk: Chunk }> =
    {};
  const chunks = new Map<string, Chunk>();
  const issues: string[] = [];
  for (const origin of origins) {
    for (const file of await files(origin, translations)) {
      const read = await readSource(file.path);
      const path = normalize(relative(origin.root, file.path));
      const name =
        origin.label === undefined ? path : `${path} (${origin.label})`;
      let chunk = chunks.get(file.prefix);
      if (chunk === undefined) {
        chunk = {
          sources: [],
          prefix: file.prefix,
          keys: [],
          translation: file.translation,
        };
        chunks.set(file.prefix, chunk);
      }
      chunk.sources.push(file.path);
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
  return { messages, chunks: [...chunks.values()] };
};
