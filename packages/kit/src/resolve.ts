import { resolve } from "node:path";

import type { Origin } from "./chain";
import type { Builder } from "./content";
import type {
  Bundle,
  Coverage,
  GenerateOptions,
  Kit,
  KitConfig,
} from "./types";
import { loadChain, mergeFormats } from "./chain";
import { createBuilder } from "./content";
import { checkTranslation, compileSource, knownFormats } from "./contract";
import { readDocument, readDocuments } from "./documents";
import { InvalidMessagesError } from "./error";
import { readTranslations } from "./read";
import { readSources } from "./sources";

/**
 * Resolves a kit config to everything a build emits: validates the config,
 * reads and compiles the source messages into the contract, then builds a
 * complete bundle per locale — a key a locale has not translated carries the
 * source message, so the runtime loads one bundle and never falls back.
 *
 * The source is one file, or a directory of them whose paths nest the keys
 * (see {@link readSources}); each locale's translations mirror it. A target
 * locale with no translations yet is not an error: its bundle is the
 * source's, and every key is reported missing.
 *
 * The content documents are built the same way, in the form the config asks
 * for: each locale has every document, the source's where it has no
 * translation.
 *
 * A config that extends others brings their messages, content and named
 * formats into the build, each read from its own package and built with its
 * own presets, translated from this project's own cache like everything
 * else; what the config declares itself wins (see {@link loadChain}).
 *
 * @param config - The kit config.
 * @param options - The project root.
 * @throws InvalidConfigError when the config breaks a rule, before reading.
 * @throws InvalidDocumentError when a document is missing or malformed.
 * @throws InvalidMessagesError when the keys do not form a tree, a message
 * does not compile or refers to a named format that does not exist, or a
 * translation does not fit its source.
 */
export const resolveKit = async (
  config: KitConfig,
  options: GenerateOptions = {},
): Promise<Kit> => {
  const root = resolve(options.cwd ?? process.cwd());
  const origins = await loadChain(config, root);
  const { settings } = origins[origins.length - 1] as Origin;
  const issues: string[] = [];

  const formats = mergeFormats(origins);
  const known = knownFormats(formats);

  const { messages: source, chunks } = await readSources(origins);
  const inputs = chunks.flatMap((chunk) => chunk.sources);
  for (const origin of origins) {
    if (origin.path !== undefined) {
      inputs.push(origin.path);
    }
  }

  const contract = compileSource(source, known);
  const { messages, reference } = contract;
  for (const [key, found] of Object.entries(contract.issues)) {
    for (const issue of found) {
      issues.push(`${settings.source}: ${JSON.stringify(key)} ${issue}`);
    }
  }

  // The content: every source document of every config, then each locale's
  // translation of it — or the source document where a locale has none —
  // each built with its config's presets, in the form this config asks for.
  const builders = new Map<Origin, Builder>();
  const builderOf = (origin: Origin): Builder => {
    let builder = builders.get(origin);
    if (builder === undefined) {
      builder = createBuilder(origin.settings.presets);
      builders.set(origin, builder);
    }
    return builder;
  };
  const held = await readDocuments(origins);
  const built: Record<string, string> = {};
  for (const [path, { origin, file, source: document }] of Object.entries(
    held,
  )) {
    built[path] = builderOf(origin).build(document, settings.output, file);
    inputs.push(file);
  }
  const content: Record<string, Record<string, string>> = {
    [settings.source]: built,
  };
  const translations = resolve(root, settings.translations);

  const bundles: Record<string, Bundle> = { [settings.source]: reference };
  const coverage: Record<string, Coverage> = {};
  for (const locale of settings.targets) {
    const translated: Record<string, string> = {};
    for (const chunk of chunks) {
      const path = chunk.translation(locale);
      const translations = await readTranslations(path);
      if (translations === undefined) {
        continue;
      }
      inputs.push(path);
      for (const [key, message] of Object.entries(translations)) {
        translated[`${chunk.prefix}${key}`] = message;
      }
    }

    const bundle: Bundle = {};
    const missing: string[] = [];
    for (const [key, message] of Object.entries(messages)) {
      const translation = Object.hasOwn(translated, key)
        ? translated[key]
        : undefined;
      const fallback = reference[key];
      if (translation === undefined) {
        missing.push(key);
        if (fallback !== undefined) {
          bundle[key] = fallback;
        }
        continue;
      }
      const checked = checkTranslation(translation, message, known);
      if (!checked.ok) {
        for (const issue of checked.issues) {
          issues.push(`${locale}: ${JSON.stringify(key)} ${issue}`);
        }
      }
      if (checked.ast !== undefined) {
        bundle[key] = checked.ast;
      }
    }
    const localized: Record<string, string> = {};
    const untranslated: string[] = [];
    const translatedDir = resolve(translations, locale);
    for (const [path, { origin }] of Object.entries(held)) {
      const translation = await readDocument(translatedDir, path);
      if (translation === undefined) {
        untranslated.push(path);
        localized[path] = built[path] as string;
      } else {
        const file = resolve(translatedDir, path);
        localized[path] = builderOf(origin).build(
          translation,
          settings.output,
          file,
        );
        inputs.push(file);
      }
    }
    content[locale] = localized;

    bundles[locale] = bundle;
    coverage[locale] = {
      documents: untranslated,
      missing,
      orphaned: Object.keys(translated).filter(
        (key) => !Object.hasOwn(source, key),
      ),
    };
  }

  if (issues.length > 0) {
    throw new InvalidMessagesError(issues);
  }
  const seen = [...builders.values()];
  return {
    locale: settings.source,
    locales: [settings.source, ...settings.targets],
    formats,
    messages,
    bundles,
    documents: Object.keys(held),
    output: settings.output,
    elements: [...new Set(seen.flatMap((b) => b.elements()))].sort(),
    directives: [...new Set(seen.flatMap((b) => b.directives()))].sort(),
    content,
    outDir: settings.outDir,
    coverage,
    inputs,
  };
};
