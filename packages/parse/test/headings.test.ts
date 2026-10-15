import { definePipeline } from "../src/pipeline";
import { describe, expect, it } from "vitest";

import { headings } from "../src/plugins/headings";

const pipeline = definePipeline({ presets: [headings()] });

describe("headings", () => {
  it("moves a trailing {#id} off the text and onto the element", () => {
    const tree = pipeline.build("## Install {#install}\n\n## Plain\n");
    expect(tree.children[0]).toMatchObject({
      tagName: "h2",
      properties: { id: "install" },
      children: [{ type: "text", value: "Install" }],
    });
    expect(tree.children[2]).toMatchObject({
      tagName: "h2",
      properties: {},
      children: [{ type: "text", value: "Plain" }],
    });
  });

  it("drops the text node when the marker was all of it", () => {
    const tree = pipeline.build("## *Install* {#install}\n");
    expect(tree.children[0]).toMatchObject({
      properties: { id: "install" },
      children: [{ tagName: "em" }],
    });
  });

  it("leaves a marker that is not an id", () => {
    const tree = pipeline.parse("## Install {#1st}\n");
    expect(tree.children[0]).toMatchObject({
      children: [{ value: "Install {#1st}" }],
    });
  });

  it("is off without the preset", () => {
    const tree = definePipeline().build("## Install {#install}\n");
    expect(tree.children[0]).toMatchObject({
      properties: {},
      children: [{ value: "Install {#install}" }],
    });
  });
});
