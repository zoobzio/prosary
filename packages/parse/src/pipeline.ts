import type { Hast, Mdast, Pipeline, PipelineOptions } from "./types";

import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { VFile } from "vfile";

/**
 * Builds a {@link Pipeline}: remark-parse, the `remark` plugins of each
 * preset, remark-rehype, the `rehype` plugins of each preset. With no
 * presets it reads CommonMark and turns it to HTML nodes, nothing more. The
 * trees keep the position of each node. A plugin that fails the file throws
 * its message.
 */
export const definePipeline = (options: PipelineOptions = {}): Pipeline => {
  const presets = options.presets ?? [];
  const remark = unified().use(remarkParse);
  const rehype = unified().use(remarkRehype);
  for (const preset of presets) {
    if (preset.remark !== undefined) {
      remark.use(preset.remark);
    }
    if (preset.rehype !== undefined) {
      rehype.use(preset.rehype);
    }
  }
  remark.freeze();
  rehype.freeze();
  const parse = (file: VFile): Mdast =>
    remark.runSync(remark.parse(file), file) as Mdast;
  return {
    parse: (source) => parse(new VFile(source)),
    build: (source) => {
      const file = new VFile(source);
      return rehype.runSync(parse(file), file) as Hast;
    },
  };
};
