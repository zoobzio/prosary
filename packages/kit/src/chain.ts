import type { Formats, Kind } from "@prosary/schema";

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { createJiti } from "jiti";

import type { KitConfig } from "./types";
import type { Settings } from "./validate";
import { InvalidConfigError } from "./error";
import { loadConfig } from "./load";
import { validate } from "./validate";

/**
 * One config of a build: the project's own, or one it extends. Every path
 * of its settings resolves against its root.
 */
export interface Origin {
  /** The absolute directory the settings' paths resolve against. */
  root: string;

  /** The config, validated. */
  settings: Settings;

  /**
   * Whether this is the project's own config — the one whose cache holds
   * every translation, and whose root a build writes under. An upstream's
   * package is read, never written.
   */
  local: boolean;

  /**
   * How the config was named — its `extends` entry, as written — to name
   * its files in a report. The project's own has none.
   */
  label?: string;

  /** The absolute path of the config file, when it was loaded from one. */
  path?: string;
}

/**
 * Resolves an `extends` entry to the config file it names: a path relative
 * to the project root, or a specifier an installed package exports,
 * resolved as the project would import it.
 */
const locate = (specifier: string, root: string): string => {
  const jiti = createJiti(import.meta.url);
  const resolved = jiti.esmResolve(specifier, {
    parentURL: pathToFileURL(join(root, "package.json")),
    try: true,
  });
  if (resolved === undefined) {
    throw new InvalidConfigError([
      `extends ${JSON.stringify(specifier)} could not be resolved from ${root} — it must be a path, or a config an installed package exports`,
    ]);
  }
  return resolved.startsWith("file:") ? fileURLToPath(resolved) : resolved;
};

/**
 * Loads the chain a config builds on: every config its `extends` names,
 * each one's own upstreams before it, and the config itself last. Each is
 * validated; an upstream's issues are reported under its name. A config
 * reached twice — through two upstreams — is read once, where it is first
 * reached.
 *
 * @param config - The project's own config.
 * @param root - The absolute project root.
 * @throws InvalidConfigError when a config breaks a rule, an `extends` entry
 * cannot be resolved, the chain has a cycle, or an upstream is written in
 * another source locale.
 */
export const loadChain = async (
  config: KitConfig,
  root: string,
): Promise<Origin[]> => {
  const local = validate(config);
  const origins: Origin[] = [];
  const seen = new Set<string>();

  const visit = async (
    settings: Settings,
    from: string,
    trail: string[],
  ): Promise<void> => {
    for (const specifier of settings.extends) {
      const path = locate(specifier, from);
      if (trail.includes(path)) {
        throw new InvalidConfigError([
          `extends ${JSON.stringify(specifier)} forms a cycle: ${[...trail, path].join(" → ")}`,
        ]);
      }
      if (seen.has(path)) {
        continue;
      }
      let upstream: Settings;
      try {
        upstream = validate(await loadConfig(path));
      } catch (error) {
        if (error instanceof InvalidConfigError) {
          throw new InvalidConfigError(
            error.issues.map((issue) => `${specifier}: ${issue}`),
          );
        }
        throw error;
      }
      if (upstream.source !== local.source) {
        throw new InvalidConfigError([
          `extends ${JSON.stringify(specifier)} is written in ${JSON.stringify(upstream.source)}, not ${JSON.stringify(local.source)} — a config extends only configs in its own source locale`,
        ]);
      }
      const directory = dirname(path);
      await visit(upstream, directory, [...trail, path]);
      seen.add(path);
      origins.push({
        root: directory,
        settings: upstream,
        local: false,
        label: specifier,
        path,
      });
    }
  };

  await visit(local, root, []);
  origins.push({ root, settings: local, local: true });
  return origins;
};

/**
 * The named formats of a chain, merged: every kind present, a format of a
 * later config replacing an earlier one's of the same name.
 *
 * @param origins - The chain, the project's own config last.
 */
export const mergeFormats = (origins: Origin[]): Required<Formats> => {
  const merged: Record<Kind, Record<string, object>> = {
    number: {},
    date: {},
    time: {},
  };
  for (const { settings } of origins) {
    for (const kind of Object.keys(merged) as Kind[]) {
      Object.assign(merged[kind], settings.formats[kind]);
    }
  }
  return merged;
};
