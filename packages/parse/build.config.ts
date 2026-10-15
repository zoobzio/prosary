import { defineBuildConfig } from "obuild/config";

export default defineBuildConfig({
  entries: [
    {
      type: "bundle",
      input: ["./src/index.ts", "./src/plugins/index.ts"],
      outDir: ".dist",
      // The syntax-tree types are augmented by the plugins, so the
      // declarations must refer to the packages themselves, not a copy.
      rolldown: { external: ["hast", "mdast", "vfile"] },
    },
  ],
});
