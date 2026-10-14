import type { Ast, Formats, Kind } from "@prosary/schema";
import type { CONTENT_OUTPUTS } from "./constant";
import type {
  Translate,
  TranslateDocument,
  TranslateOptions,
} from "@prosary/translate";

/**
 * The authored `prosary.config.ts`: where the source messages live, the
 * locale they are written in, the locales they are translated to, and where
 * the build writes.
 */
export interface KitConfig {
  /**
   * The source messages, as a path relative to the project root: a FormatJS
   * message-descriptor JSON document
   * (`{ "key": { "defaultMessage": "…", "description": "…" } }`), or a
   * directory of them — every `.json` file under it, at any depth, its keys
   * nested under its path. `title` in `checkout/cart.json` is the message
   * `checkout.cart.title`, called as `$t.checkout.cart.title()`.
   */
  messages: string;

  /**
   * How the messages and the content translate: the locale they are written
   * in, the locales they are translated to, and — for `prosary translate` to
   * call a model — the model and its settings.
   */
  translate: TranslateConfig;

  /**
   * The Markdown content in the source locale: a directory, relative to the
   * project root, or an object that names the directory and the form the
   * documents are built in. Every `.md` file under the directory, at any
   * depth, is a document. Each is translated to
   * `<translations>/<locale>/<path>` and built to `content/<locale>/<path>`
   * in the output, with the extension of its form. Unset, there is no
   * content.
   */
  content?: string | ContentConfig;

  /**
   * Named number, date and time formats, by kind: `Intl` options a message
   * refers to by name (`{amount, number, price}`) and the runtime's helpers
   * take in place of options. A message naming a format that is neither
   * declared here nor built in fails the build.
   */
  formats?: Formats;

  /**
   * The output directory, relative to the project root. Defaults to
   * `prosary`.
   */
  outDir?: string;
}

/**
 * The form a built content document takes.
 *
 * - `md` — the Markdown as written
 * - `mdast` — the Markdown syntax tree, as JSON
 * - `hast` — the HTML syntax tree, as JSON
 * - `html` — an HTML string
 *
 * The trees carry the frontmatter as `data.matter` on the root and no
 * positions. The HTML carries neither.
 */
export type ContentOutput = (typeof CONTENT_OUTPUTS)[number];

/**
 * The content, with the form its documents are built in.
 */
export interface ContentConfig {
  /** The directory of Markdown documents, relative to the project root. */
  dir: string;

  /** The form the documents are built in. Defaults to `hast`. */
  output?: ContentOutput;
}

/**
 * The translation of a project: where it starts, where it goes, and how.
 * The model and its settings are the options of `@prosary/translate`, an
 * optional peer of the kit: installed and configured only to translate,
 * never to build.
 */
export interface TranslateConfig extends Partial<TranslateOptions> {
  /**
   * The locale the source messages and content are written in, as a
   * canonical BCP 47 tag (`en`, `pt-BR`). The reference every target falls
   * back to.
   */
  source: string;

  /**
   * The locales the source is translated to, as canonical BCP 47 tags. The
   * build emits a bundle for each, plus one for the source. Defaults to none.
   */
  targets?: string[];

  /**
   * The directory the translations are cached in, relative to the project
   * root: what `prosary translate` writes and the build reads, mirroring the
   * source: one `<locale>.json` per
   * target for a source that is a single file, `<locale>/<path>` per file of
   * a source directory, and `<locale>/<path>` per content document. Defaults
   * to `translations`.
   */
  cache?: string;
}

/**
 * The I/O hooks of a build.
 */
export interface GenerateOptions {
  /**
   * The project root: the source and the translations resolve against it.
   * Defaults to `process.cwd()`.
   */
  cwd?: string;
}

/** Options for {@link build}: the I/O hooks plus where the project lives. */
export type BuildOptions = Omit<GenerateOptions, "cwd"> & {
  /** The project root; defaults to `process.cwd()`. */
  root?: string;

  /** The config file, relative to `root`; defaults to `prosary.config.ts`. */
  config?: string;
};

/**
 * One source message as authored: the ICU message in the source locale, and
 * the note that tells a translator what it is for.
 */
export interface Descriptor {
  defaultMessage: string;
  description?: string;
}

/**
 * What a message does with one of its arguments, which decides the type a
 * caller must pass —
 *
 * - `value` — interpolated as is (`{name}`)
 * - `number` — formatted or pluralized (`{n, number}`, `{n, plural, …}`)
 * - `date` — formatted as a date or a time (`{at, date}`, `{at, time}`)
 * - `select` — matched against the listed `options` (`{kind, select, …}`)
 * - `tag` — wraps a part of the message (`<b>…</b>`)
 */
export type Argument =
  | { kind: "value" }
  | { kind: "number" }
  | { kind: "date" }
  | { kind: "select"; options: string[] }
  | { kind: "tag" };

/** The arguments of one message, by name. */
export type Arguments = Record<string, Argument>;

/** The named formats a message refers to, by kind. */
export type Uses = Record<Kind, string[]>;

/**
 * A message compiled: the AST the runtime formats, what it takes, and the
 * named formats it refers to.
 */
export interface Compiled {
  ast: Ast;
  arguments: Arguments;
  formats: Uses;
}

/**
 * One message of the contract: what a caller must pass, and the authored
 * source it was derived from.
 */
export interface Message {
  /** The arguments the source message takes. */
  arguments: Arguments;

  /** The ICU message in the source locale. */
  source: string;

  /** The translator note, when there is one. */
  description?: string;
}

/** One locale's messages, every key of the contract compiled to its AST. */
export type Bundle = Record<string, Ast>;

/** How one target locale stands against the source. */
export interface Coverage {
  /** Keys with no translation: the bundle carries the source message. */
  missing: string[];

  /** Translated keys the source no longer has: left out of the bundle. */
  orphaned: string[];

  /** Documents with no translation: built from the source document. */
  documents: string[];
}

/**
 * The validated base of a build: the contract read off the source messages,
 * and a complete bundle per locale. What the emitters read.
 */
export interface Core {
  /** The source locale. */
  locale: string;

  /** Every locale a bundle is built for, the source locale first. */
  locales: string[];

  /** The declared named formats, every kind present. */
  formats: Required<Formats>;

  /** The contract: every message key, in source order. */
  messages: Record<string, Message>;

  /** A bundle per locale, each carrying every key of the contract. */
  bundles: Record<string, Bundle>;

  /** Every content document, as posix paths under the content directory. */
  documents: string[];

  /** The form the content documents are built in. */
  output: ContentOutput;

  /**
   * The content per locale, each carrying every document: a document a
   * locale has not translated is the source's.
   */
  content: Record<string, Record<string, string>>;
}

/**
 * A config resolved: the {@link Core} of the build, plus where it writes,
 * what it read, and how complete each translation is. What {@link resolveKit}
 * returns.
 */
export interface Kit extends Core {
  /** The output directory, normalized and relative to the project root. */
  outDir: string;

  /** Each target locale's missing and orphaned keys. */
  coverage: Record<string, Coverage>;

  /**
   * The absolute path of every file the build read, the source messages
   * first — what a dev server watches to rebuild on change.
   */
  inputs: string[];
}

/** One emitted file, its path relative to the output directory. */
export interface OutputFile {
  path: string;
  contents: string;
}

/**
 * What {@link generate} returns: the files to write under `outDir`, and each
 * target locale's coverage. No filesystem writes — the caller owns I/O.
 */
export interface Output {
  outDir: string;
  files: OutputFile[];
  coverage: Record<string, Coverage>;
}

/** Options for {@link translate}: where the project lives, and what to run. */
export interface TranslateRunOptions {
  /** The project root; defaults to `process.cwd()`. */
  root?: string;

  /** The config file, relative to `root`; defaults to `prosary.config.ts`. */
  config?: string;

  /**
   * The target locales to translate; defaults to every locale the config
   * lists.
   */
  locales?: string[];

  /**
   * Only report what is missing or out of date: no model is called and no
   * file is written. Needs no `translate.model`.
   */
  check?: boolean;

  /**
   * How the run translates, in place of the config's own `translate`: what
   * a caller that holds the options itself — a framework module — passes.
   */
  translate?: TranslateOptions;

  /**
   * The translator every batch of messages goes through; defaults to
   * `@prosary/translate`'s. The seam for another executor, or a test's.
   */
  translator?: Translate;

  /**
   * The translator every document goes through; defaults to
   * `@prosary/translate`'s.
   */
  documentTranslator?: TranslateDocument;
}

/** What one run did for one locale's documents. */
export interface TranslatedDocuments {
  /** Documents translated, or brought up to date, and written. */
  written: string[];

  /**
   * Documents whose translation came back but does not hold — its front
   * matter or code blocks did not survive — with every reason. Not written.
   */
  rejected: Record<string, string[]>;

  /**
   * On a check, the documents a run would translate or bring up to date.
   * Always empty on a real run.
   */
  pending: string[];
}

/** What one run did for one target locale. */
export interface Translated {
  /** Keys translated and written, in source order. */
  written: string[];

  /**
   * Keys whose translation came back but does not hold — it does not
   * compile, or does not fit its source — with every reason. Not written.
   */
  rejected: Record<string, string[]>;

  /** Keys asked for that the translator did not answer. */
  skipped: string[];

  /**
   * Keys whose source changed under a translation someone wrote or edited
   * by hand. The translation is kept, and worth a look.
   */
  kept: string[];

  /**
   * On a check, the keys a run would translate: the ones the locale lacks,
   * and the ones whose source has changed. Always empty on a real run.
   */
  pending: string[];

  /** What the run did for the locale's documents. */
  documents: TranslatedDocuments;
}

/** What {@link translate} returns: each locale's outcome, by locale. */
export type TranslateOutput = Record<string, Translated>;
