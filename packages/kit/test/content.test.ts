import type { TranslateDocument } from "@prosary/translate";

import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { build } from "../src/build";
import { contentPath, createBuilder } from "../src/content";
import { checkDocument, listDocuments } from "../src/documents";
import { InvalidConfigError, InvalidDocumentError } from "../src/error";
import { translate } from "../src/translate";
import { CONFIG, discard, project } from "./helpers";

const INTRO = `---
title: Getting started
order: 1
---

# Getting started

Install the package:

\`\`\`sh
pnpm add prosary
\`\`\`
`;

const FAQ = "# Questions\n\nAsk away.\n";

/** The presets, by source: the throwaway project cannot resolve the package by name. */
const PRESETS = JSON.stringify(
  fileURLToPath(new URL("../../parse/src/plugins/index.ts", import.meta.url)),
);

/**
 * A config module building the content with the matter preset, the rest of
 * the content settings and the translate settings as given.
 */
const configured = (
  content: string,
  translate = JSON.stringify(CONFIG.translate),
) =>
  `import { matter } from ${PRESETS};\nexport default { ...${JSON.stringify(CONFIG)}, translate: ${translate}, content: { ${content}, presets: [matter()] } };\n`;

let root: string;

/** Writes a file of the project, creating its directories. */
const write = async (path: string, contents: string) => {
  await mkdir(dirname(join(root, path)), { recursive: true });
  await writeFile(join(root, path), contents);
};

const read = (path: string) => readFile(join(root, path), "utf8");

beforeEach(async () => {
  root = await project();
  await write(
    "prosary.config.ts",
    configured(
      'dir: "content"',
      JSON.stringify({ ...CONFIG.translate, model: "test/model" }),
    ),
  );
  await write("content/guide/intro.md", INTRO);
  await write("content/faq.md", FAQ);
  await write("content/notes.txt", "not a document");
});

afterEach(async () => {
  await discard(root);
});

/** A message translator with nothing to say: these tests are about documents. */
const translator = async () => ({});

/** A document translator that marks prose lines, leaving structure alone. */
const mark = () =>
  vi.fn<TranslateDocument>(async ({ target, document }) =>
    document
      .replace("Install the package:", `[${target}] Install the package:`)
      .replace("Ask away.", `[${target}] Ask away.`),
  );

describe("listDocuments", () => {
  it("lists the Markdown files at any depth, sorted, as posix paths", async () => {
    await expect(listDocuments(join(root, "content"))).resolves.toEqual([
      "faq.md",
      "guide/intro.md",
    ]);
  });

  it("lists nothing for a directory that does not exist", async () => {
    await expect(listDocuments(join(root, "nope"))).resolves.toEqual([]);
  });
});

describe("checkDocument", () => {
  it("accepts a translation that keeps the structure", () => {
    expect(
      checkDocument(INTRO, INTRO.replaceAll("Getting started", "Démarrer")),
    ).toEqual([]);
  });

  it("rejects an empty translation", () => {
    expect(checkDocument(INTRO, " \n")).toEqual(["is empty"]);
  });

  it("rejects front matter that lost, gained or dropped keys", () => {
    expect(checkDocument(INTRO, INTRO.replace("order: 1", "ordre: 1"))).toEqual(
      ["lost the front matter keys order", "added the front matter keys ordre"],
    );
    expect(
      checkDocument(INTRO, INTRO.replace(/^---[\s\S]*?---\n\n/, "")),
    ).toEqual(["lost the source's front matter"]);
    expect(checkDocument(FAQ, `---\ntitle: FAQ\n---\n\n${FAQ}`)).toEqual([
      "has front matter, which the source does not",
    ]);
  });

  it("rejects a code block that changed, went missing or appeared", () => {
    expect(
      checkDocument(INTRO, INTRO.replace("pnpm add", "pnpm ajouter")),
    ).toEqual(["changed fenced code block 1"]);
    expect(checkDocument(INTRO, INTRO.replace("```sh", "```bash"))).toEqual([
      "changed fenced code block 1",
    ]);
    expect(
      checkDocument(INTRO, INTRO.replace(/```sh[\s\S]*```\n/, "")),
    ).toEqual(["has 0 fenced code blocks where the source has 1"]);
    expect(checkDocument(FAQ, `\`\`\`markdown\n${FAQ}\`\`\`\n`)).toEqual([
      "has 1 fenced code blocks where the source has 0",
    ]);
  });
});

describe("translate, with content", () => {
  it("translates each document a locale lacks, to translations/<locale>/", async () => {
    const documentTranslator = mark();
    const output = await translate({ root, translator, documentTranslator });
    expect(output.fr?.documents).toEqual({
      written: ["faq.md", "guide/intro.md"],
      rejected: {},
      pending: [],
    });
    expect(documentTranslator).toHaveBeenCalledWith(
      {
        source: "en",
        target: "fr",
        path: "guide/intro.md",
        document: INTRO,
      },
      { model: "test/model" },
    );
    expect(await read("translations/fr/guide/intro.md")).toContain(
      "[fr] Install the package:",
    );
    expect(await read("translations/fr/faq.md")).toBe(
      "# Questions\n\n[fr] Ask away.\n",
    );
  });

  it("does nothing on a second run", async () => {
    await translate({ root, translator, documentTranslator: mark() });
    const documentTranslator = mark();
    const output = await translate({ root, translator, documentTranslator });
    expect(documentTranslator).not.toHaveBeenCalled();
    expect(output.fr?.documents.written).toEqual([]);
  });

  it("brings a translation up to date when its source changes, from what it has", async () => {
    await translate({ root, translator, documentTranslator: mark() });
    // Someone polishes the translation, then the source gains a line.
    await write("translations/fr/faq.md", "# Questions\n\nDemandez.\n");
    await write("content/faq.md", `${FAQ}\nWe answer.\n`);

    const documentTranslator = vi.fn<TranslateDocument>(
      async ({ previous }) => `${previous}\nNous répondons.\n`,
    );
    const output = await translate({ root, translator, documentTranslator });
    expect(output.fr?.documents.written).toEqual(["faq.md"]);
    expect(documentTranslator).toHaveBeenCalledTimes(1);
    expect(documentTranslator.mock.calls[0]?.[0]).toEqual({
      source: "en",
      target: "fr",
      path: "faq.md",
      document: `${FAQ}\nWe answer.\n`,
      previous: "# Questions\n\nDemandez.\n",
    });
    expect(await read("translations/fr/faq.md")).toBe(
      "# Questions\n\nDemandez.\n\nNous répondons.\n",
    );
  });

  it("leaves a hand-edited translation alone while its source is unchanged", async () => {
    await translate({ root, translator, documentTranslator: mark() });
    await write("translations/fr/faq.md", "# Questions\n\nDemandez.\n");
    const documentTranslator = mark();
    await translate({ root, translator, documentTranslator });
    expect(documentTranslator).not.toHaveBeenCalled();
    expect(await read("translations/fr/faq.md")).toBe(
      "# Questions\n\nDemandez.\n",
    );
  });

  it("adopts a translation someone wrote before any run", async () => {
    await write("translations/fr/faq.md", "# Questions\n\nÀ vous.\n");
    const documentTranslator = mark();
    const output = await translate({ root, translator, documentTranslator });
    expect(output.fr?.documents.written).toEqual(["guide/intro.md"]);
    expect(await read("translations/fr/faq.md")).toBe(
      "# Questions\n\nÀ vous.\n",
    );
  });

  it("rejects a document whose structure did not survive, and asks again", async () => {
    const broken = vi.fn<TranslateDocument>(async ({ document }) =>
      document.replace("pnpm add", "pnpm ajouter"),
    );
    const output = await translate({
      root,
      translator,
      documentTranslator: broken,
    });
    expect(output.fr?.documents).toEqual({
      written: ["faq.md"],
      rejected: { "guide/intro.md": ["changed fenced code block 1"] },
      pending: [],
    });
    await expect(read("translations/fr/guide/intro.md")).rejects.toThrow();

    const again = mark();
    await translate({ root, translator, documentTranslator: again });
    expect(again.mock.calls.map(([request]) => request.path)).toEqual([
      "guide/intro.md",
    ]);
  });

  it("checks which documents a run would translate or update, writing nothing", async () => {
    const documentTranslator = mark();
    const first = await translate({ root, documentTranslator, check: true });
    expect(first.fr?.documents.pending).toEqual(["faq.md", "guide/intro.md"]);
    expect(documentTranslator).not.toHaveBeenCalled();
    await expect(read("translations/fr/faq.md")).rejects.toThrow();

    await translate({ root, translator, documentTranslator });
    expect(
      (await translate({ root, check: true })).fr?.documents.pending,
    ).toEqual([]);

    await write("content/faq.md", `${FAQ}\nWe answer.\n`);
    expect(
      (await translate({ root, check: true })).fr?.documents.pending,
    ).toEqual(["faq.md"]);
  });

  it("records documents in the lock apart from messages, and forgets removed ones", async () => {
    await translate({ root, translator, documentTranslator: mark() });
    const lock = JSON.parse(await read("translations/.prosary.lock.json"));
    expect(Object.keys(lock.fr.documents)).toEqual([
      "faq.md",
      "guide/intro.md",
    ]);
    expect(lock.fr.messages).not.toHaveProperty("faq.md");

    await rm(join(root, "content/faq.md"));
    await translate({ root, translator, documentTranslator: mark() });
    const after = JSON.parse(await read("translations/.prosary.lock.json"));
    expect(Object.keys(after.fr.documents)).toEqual(["guide/intro.md"]);
  });
});

describe("build, with content", () => {
  it("emits every document for every locale as hast, the source filling the gaps", async () => {
    await write("translations/fr/faq.md", "# Questions\n\nDemandez.\n");
    const output = await build({ root });
    expect(output.coverage.fr?.documents).toEqual(["guide/intro.md"]);
    const written = (
      await readdir(join(root, "prosary/content"), { recursive: true })
    ).sort();
    expect(written).toEqual([
      "en",
      "en/faq.json",
      "en/guide",
      "en/guide/intro.json",
      "fr",
      "fr/faq.json",
      "fr/guide",
      "fr/guide/intro.json",
    ]);
    const tree = async (path: string) => JSON.parse(await read(path));
    expect(await tree("prosary/content/fr/faq.json")).toMatchObject({
      type: "root",
      children: [
        { type: "element", tagName: "h1" },
        { type: "text", value: "\n" },
        {
          type: "element",
          tagName: "p",
          children: [{ type: "text", value: "Demandez." }],
        },
      ],
    });
    expect(await tree("prosary/content/fr/guide/intro.json")).toEqual(
      await tree("prosary/content/en/guide/intro.json"),
    );
    expect(await read("prosary/index.mjs")).toContain(
      'export const content = Object.freeze({ output: "hast", marker: "dataDirective" });',
    );
  });

  it("lists the elements and directives the content builds to, typed", async () => {
    await write(
      "prosary.config.ts",
      `import { directives } from ${PRESETS};\nexport default { ...${JSON.stringify(CONFIG)}, content: { dir: "content", presets: [directives()] } };\n`,
    );
    await write(
      "content/faq.md",
      ":::callout{kind=info}\nAsk :badge[now].\n:::\n",
    );
    await write("translations/fr/faq.md", "::rule\n");
    await build({ root });
    const dts = await read("prosary/index.d.mts");
    expect(dts).toContain(
      'export type Element =\n  | "code"\n  | "div"\n  | "h1"\n  | "h2"\n  | "hr"\n  | "p"\n  | "pre"\n  | "span";',
    );
    expect(dts).toContain(
      'export type Directive =\n  | "badge"\n  | "callout"\n  | "rule";',
    );
    expect(await read("prosary/index.mjs")).toContain(
      'export const directives = Object.freeze([\n  "badge",\n  "callout",\n  "rule"\n]);',
    );
  });

  it("builds CommonMark only without presets", async () => {
    await write(
      "prosary.config.ts",
      `export default ${JSON.stringify({ ...CONFIG, content: "content" })};\n`,
    );
    await build({ root });
    const tree = JSON.parse(await read("prosary/content/en/guide/intro.json"));
    expect(tree.data).toBeUndefined();
    expect(await read("prosary/index.d.mts")).toContain(
      'export type Element =\n  | "code"\n  | "h1"\n  | "h2"\n  | "hr"\n  | "p"\n  | "pre";',
    );
  });

  it("lists the documents in the contract module, typed", async () => {
    await build({ root });
    expect(await read("prosary/index.mjs")).toContain('"guide/intro.md"');
    expect(await read("prosary/index.d.mts")).toContain(
      'export type Document =\n  | "faq.md"\n  | "guide/intro.md";',
    );
  });

  it("builds no content when the config names no directory", async () => {
    await write(
      "prosary.config.ts",
      `export default ${JSON.stringify(CONFIG)};\n`,
    );
    const output = await build({ root });
    expect(output.files.some((file) => file.path.startsWith("content/"))).toBe(
      false,
    );
    expect(await read("prosary/index.d.mts")).toContain(
      "export type Document = never;",
    );
  });

  it("removes the built copy of a document that was deleted", async () => {
    await build({ root });
    await rm(join(root, "content/faq.md"));
    await build({ root });
    await expect(read("prosary/content/en/faq.json")).rejects.toThrow();
    expect(
      JSON.parse(await read("prosary/content/en/guide/intro.json")).type,
    ).toBe("root");
  });
});

describe("build, with a content output", () => {
  /** Points the config at the content directory, in the given form. */
  const configure = (output: string) =>
    write(
      "prosary.config.ts",
      configured(`dir: "content", output: ${JSON.stringify(output)}`),
    );

  /** The content files a build emitted, by path under the output directory. */
  const emitted = async () =>
    (await readdir(join(root, "prosary/content"), { recursive: true }))
      .filter((path) => path.includes("."))
      .sort();

  it("names the built file by the form", () => {
    expect(contentPath("guide/intro.md", "md")).toBe("guide/intro.md");
    expect(contentPath("guide/intro.md", "mdast")).toBe("guide/intro.json");
    expect(contentPath("guide/intro.md", "hast")).toBe("guide/intro.json");
    expect(contentPath("guide/intro.md", "html")).toBe("guide/intro.html");
  });

  it("keeps the Markdown as written under md", async () => {
    await configure("md");
    await build({ root });
    expect(await emitted()).toEqual([
      "en/faq.md",
      "en/guide/intro.md",
      "fr/faq.md",
      "fr/guide/intro.md",
    ]);
    expect(await read("prosary/content/en/guide/intro.md")).toBe(INTRO);
    expect(createBuilder([]).build(INTRO, "md", "intro.md")).toBe(INTRO);
  });

  it("builds the Markdown syntax tree as JSON, positions left out", async () => {
    await configure("mdast");
    await build({ root });
    expect(await emitted()).toEqual([
      "en/faq.json",
      "en/guide/intro.json",
      "fr/faq.json",
      "fr/guide/intro.json",
    ]);
    const text = await read("prosary/content/en/guide/intro.json");
    expect(text).not.toContain('"position"');
    const tree = JSON.parse(text);
    expect(tree.type).toBe("root");
    expect(tree.data.matter).toEqual({ title: "Getting started", order: 1 });
    expect(tree.children.map((node: { type: string }) => node.type)).toEqual([
      "heading",
      "paragraph",
      "code",
    ]);
    expect(tree.children[2]).toEqual({
      type: "code",
      lang: "sh",
      meta: null,
      value: "pnpm add prosary",
    });
  });

  it("builds the HTML syntax tree as JSON by default, the frontmatter on its root", async () => {
    await write("translations/fr/faq.md", "# Questions\n\nDemandez.\n");
    const output = await build({ root });
    expect(output.coverage.fr?.documents).toEqual(["guide/intro.md"]);
    expect(await emitted()).toEqual([
      "en/faq.json",
      "en/guide/intro.json",
      "fr/faq.json",
      "fr/guide/intro.json",
    ]);
    const tree = JSON.parse(await read("prosary/content/en/guide/intro.json"));
    expect(tree.type).toBe("root");
    expect(tree.data.matter).toEqual({ title: "Getting started", order: 1 });
    const elements = tree.children.filter(
      (node: { type: string }) => node.type === "element",
    );
    expect(elements.map((node: { tagName: string }) => node.tagName)).toEqual([
      "h1",
      "p",
      "pre",
    ]);
    expect(elements[0].children).toEqual([
      { type: "text", value: "Getting started" },
    ]);
    const fr = JSON.parse(await read("prosary/content/fr/faq.json"));
    expect(JSON.stringify(fr)).toContain("Demandez.");
    expect(fr.data).toBeUndefined();
  });

  it("builds an HTML string", async () => {
    await configure("html");
    await build({ root });
    expect(await emitted()).toEqual([
      "en/faq.html",
      "en/guide/intro.html",
      "fr/faq.html",
      "fr/guide/intro.html",
    ]);
    const html = await read("prosary/content/en/guide/intro.html");
    expect(html).toContain("<h1>Getting started</h1>");
    expect(html).toContain('<pre><code class="language-sh">pnpm add prosary');
    expect(html).not.toContain("title:");
    expect(await read("prosary/content/en/faq.html")).toBe(
      "<h1>Questions</h1>\n<p>Ask away.</p>",
    );
  });

  it("lists the documents by their source path whatever the form", async () => {
    await configure("hast");
    await build({ root });
    expect(await read("prosary/index.d.mts")).toContain(
      'export type Document =\n  | "faq.md"\n  | "guide/intro.md";',
    );
  });

  it("rejects a form it does not know, presets that are not a list, and content that is neither a path nor an object", async () => {
    await configure("pdf");
    await expect(build({ root })).rejects.toThrow(InvalidConfigError);
    await expect(build({ root })).rejects.toThrow(
      "content.output must be one of md, mdast, hast, html",
    );
    await write(
      "prosary.config.ts",
      `export default ${JSON.stringify({ ...CONFIG, content: { dir: "content", presets: "matter" } })};\n`,
    );
    await expect(build({ root })).rejects.toThrow(
      "content.presets must be a list of presets",
    );
    await write(
      "prosary.config.ts",
      `export default ${JSON.stringify({ ...CONFIG, content: { output: "hast" } })};\n`,
    );
    await expect(build({ root })).rejects.toThrow(
      "content.dir must be a directory inside the project root",
    );
    await write(
      "prosary.config.ts",
      `export default ${JSON.stringify({ ...CONFIG, content: 3 })};\n`,
    );
    await expect(build({ root })).rejects.toThrow(
      "content must be a directory, or an object with a dir, presets and an output",
    );
  });

  it("rejects a document whose frontmatter does not parse, naming the file and the line", async () => {
    await configure("hast");
    await write("content/bad.md", "---\n- a\n---\n\n# Hi\n");
    await expect(build({ root })).rejects.toThrow(InvalidDocumentError);
    await expect(build({ root })).rejects.toThrow(
      `${join(root, "content/bad.md")} could not be parsed: Frontmatter must be a YAML map. at 1:1`,
    );
    await rm(join(root, "content/bad.md"));
    await write("translations/fr/faq.md", "---\nid: [\n---\n\n# Q\n");
    await expect(build({ root })).rejects.toThrow(
      join(root, "translations/fr/faq.md"),
    );
  });
});
