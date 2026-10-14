import { defineBuildConfig } from "obuild/config";

/**
 * The runtime files, one entry each: Nuxt resolves them by path and compiles
 * them in the app, where the `#app`, `#imports`, and `#build` virtuals exist.
 * Built as entries of the one bundle, they keep their paths under `.dist`,
 * share what they import through chunks, and get declarations with the full
 * inference of TypeScript, which the transform mode's isolated declarations
 * cannot give every file.
 */
const runtime = [
  "client",
  "composable",
  "negotiate",
  "plugin",
  "side",
  "store",
  "types",
].map((name) => `./src/runtime/${name}.ts`);

export default defineBuildConfig({
  entries: [
    {
      type: "bundle",
      input: [
        "./src/module.ts",
        "./src/config.ts",
        "./src/constant.ts",
        "./src/server/index.ts",
        ...runtime,
      ],
      outDir: ".dist",
      // The dependencies, the peers, and the `#` virtuals are external by
      // default. The host's own packages are imported for their types only
      // and are not dependencies, so they are named here to stay out of the
      // declarations.
      rolldown: { external: ["@nuxt/schema", "nuxt", "vite"] },
    },
  ],
});
