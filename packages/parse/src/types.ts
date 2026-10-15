import type { Root as Hast } from "hast";
import type { Root as Mdast } from "mdast";
import type { PluggableList } from "unified";

/**
 * A preset: plugins for each side of the pipeline. The `remark` plugins run
 * on the Markdown tree after it is parsed, in order; the `rehype` plugins run
 * on the HTML tree after the bridge, in order. Each list is what unified's
 * `use` takes: a plugin, or a plugin with its options.
 */
export interface Preset {
  remark?: PluggableList;
  rehype?: PluggableList;
}

/** What {@link definePipeline} takes. */
export interface PipelineOptions {
  /** The presets, applied in order on each side. Defaults to none. */
  presets?: Preset[];
}

/**
 * A pipeline from Markdown to an HTML tree, with a stop at the Markdown
 * tree. `parse` runs the Markdown side; `build` runs both.
 */
export interface Pipeline {
  parse: (source: string) => Mdast;
  build: (source: string) => Hast;
}

export type { Hast, Mdast };
