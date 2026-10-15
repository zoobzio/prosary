import { defineBuildConfig } from "obuild/config";

export default defineBuildConfig({
  entries: [
    {
      type: "bundle",
      input: ["./src/index.ts"],
      outDir: ".dist",
      // The tree types are augmented by the parse plugins, so the
      // declarations must refer to the package itself, not a copy.
      rolldown: { external: ["hast"] },
    },
  ],
});
