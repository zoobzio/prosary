import type { Formats, Kind } from "@prosary/schema";

import { record } from "objectively";

import type { TranslateOptions } from "@prosary/translate";

import type { ContentOutput, KitConfig } from "./types";
import {
  CONTENT_OUTPUTS,
  DEFAULT_OUTPUT,
  OUT_DIR,
  TRANSLATIONS,
} from "./constant";
import { InvalidConfigError } from "./error";
import { inside, normalize } from "./path";

/** A config through {@link validate}: defaults applied, paths normalized. */
export interface Settings {
  messages: string;
  source: string;
  targets: string[];
  translations: string;
  content: string | undefined;
  output: ContentOutput;
  formats: Required<Formats>;
  translate: TranslateOptions | undefined;
  outDir: string;
}

/** How each kind of format proves its options: by constructing with them. */
const CONSTRUCT: Record<Kind, (options: object) => unknown> = {
  number: (options) => new Intl.NumberFormat("en", options),
  date: (options) => new Intl.DateTimeFormat("en", options),
  time: (options) => new Intl.DateTimeFormat("en", options),
};

/** Whether a value names a form a content document can be built in. */
const isOutput = (value: unknown): value is ContentOutput => {
  return (
    typeof value === "string" &&
    (CONTENT_OUTPUTS as readonly string[]).includes(value)
  );
};

/**
 * Checks the declared formats — each kind a record of names to `Intl`
 * options the runtime can construct a formatter from — noting every issue,
 * and returns them with every kind present.
 */
const formats = (value: unknown, issues: string[]): Required<Formats> => {
  const checked: Record<Kind, Record<string, object>> = {
    number: {},
    date: {},
    time: {},
  };
  if (value === undefined) {
    return checked;
  }
  if (!record(value)) {
    issues.push("formats must be a record of number, date and time formats");
    return checked;
  }
  for (const kind of Object.keys(value)) {
    if (kind !== "number" && kind !== "date" && kind !== "time") {
      issues.push(
        `formats.${kind} is not a kind of format (number, date, time)`,
      );
      continue;
    }
    const named = value[kind];
    if (!record(named)) {
      issues.push(`formats.${kind} must be a record of names to Intl options`);
      continue;
    }
    for (const [name, options] of Object.entries(named)) {
      if (!record(options)) {
        issues.push(
          `formats.${kind}.${name} must be an object of Intl options`,
        );
        continue;
      }
      try {
        CONSTRUCT[kind](options);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        issues.push(`formats.${kind}.${name} is not valid (${reason})`);
        continue;
      }
      checked[kind][name] = options;
    }
  }
  return checked;
};

/**
 * The issue with a locale tag, if any: it must be a string that is already
 * its own canonical BCP 47 form, since it names a file and a member of the
 * emitted `Locale` union.
 */
const tag = (label: string, locale: unknown): string | undefined => {
  if (typeof locale !== "string") {
    return `${label} must be a string`;
  }
  let canonical: string | undefined;
  try {
    [canonical] = Intl.getCanonicalLocales(locale);
  } catch {
    return `${label} ${JSON.stringify(locale)} is not a BCP 47 locale tag`;
  }
  if (canonical !== locale) {
    return `${label} ${JSON.stringify(locale)} must be written canonically, as ${JSON.stringify(canonical)}`;
  }
  return undefined;
};

/**
 * Checks a config against every rule that can be decided without reading a
 * document, and applies its defaults.
 *
 * @param config - The authored config.
 * @throws InvalidConfigError carrying every issue found.
 */
export const validate = (config: KitConfig): Settings => {
  const issues: string[] = [];
  const note = (issue: string | undefined) => {
    if (issue !== undefined) {
      issues.push(issue);
    }
  };

  const directory = (label: string, path: unknown, fallback: string) => {
    if (path === undefined) {
      return fallback;
    }
    if (typeof path !== "string" || !inside(normalize(path))) {
      issues.push(`${label} must be a directory inside the project root`);
      return fallback;
    }
    return normalize(path);
  };

  if (typeof config.messages !== "string" || config.messages === "") {
    issues.push(
      "messages must be the path of a message-descriptor document, or of a directory of them",
    );
  }

  /* The translation: the source locale, the targets, and — with a model —
     the options a run translates by. */
  let source = "";
  let targets: string[] = [];
  let translations = TRANSLATIONS;
  let run: TranslateOptions | undefined;
  if (!record(config.translate)) {
    issues.push(
      "translate must be an object naming the source locale and the target locales",
    );
  } else {
    const {
      source: from,
      targets: to,
      cache: into,
      ...options
    } = config.translate;
    note(tag("translate.source", from));
    if (typeof from === "string") {
      source = from;
    }
    if (to !== undefined && !Array.isArray(to)) {
      issues.push("translate.targets must be an array of locale tags");
    } else if (to !== undefined) {
      const seen = new Set<unknown>();
      for (const [index, target] of to.entries()) {
        note(tag(`translate.targets[${index}]`, target));
        if (target === from) {
          issues.push(
            `translate.targets[${index}] ${JSON.stringify(target)} is the source locale — list only the locales it is translated to`,
          );
        }
        if (seen.has(target)) {
          issues.push(
            `translate.targets[${index}] ${JSON.stringify(target)} is listed twice`,
          );
        }
        seen.add(target);
      }
      targets = [...to];
    }
    translations = directory("translate.cache", into, TRANSLATIONS);
    if (options.model !== undefined) {
      run = options as TranslateOptions;
    }
  }

  const outDir = directory("outDir", config.outDir, OUT_DIR);

  /* The content: a directory, or a directory and the form to build in. */
  let content: string | undefined;
  let output: ContentOutput = DEFAULT_OUTPUT;
  if (typeof config.content === "string") {
    content = directory("content", config.content, "");
  } else if (record(config.content)) {
    if (config.content.dir === undefined) {
      issues.push("content.dir must be a directory inside the project root");
      content = "";
    } else {
      content = directory("content.dir", config.content.dir, "");
    }
    if (config.content.output !== undefined) {
      if (isOutput(config.content.output)) {
        output = config.content.output;
      } else {
        issues.push(
          `content.output must be one of ${CONTENT_OUTPUTS.join(", ")}`,
        );
      }
    }
  } else if (config.content !== undefined) {
    issues.push(
      "content must be a directory, or an object with a dir and an output",
    );
  }

  const declared = formats(config.formats, issues);

  if (issues.length > 0) {
    throw new InvalidConfigError(issues);
  }
  return {
    messages: config.messages,
    source,
    targets,
    translations,
    content,
    output,
    formats: declared,
    translate: run,
    outDir,
  };
};
