import type { NuxtProsaryConfig } from "./config";

import {
  defineNuxtModule,
  addTemplate,
  addPlugin,
  addImports,
  addServerHandler,
  addComponent,
  createResolver,
} from "@nuxt/kit";

import { resolve } from "node:path";

import { componentsModule, scanOverrides } from "./components";
import { CONTENT_URL, MODULES, OVERRIDES } from "./constant";
import { loadSource } from "./kit";

/**
 * Nuxt module for prosary.
 *
 * Its messages are always FormatJS descriptors built by `@prosary/kit`:
 * either the app's own `prosary.config.ts`, built here, or the output of a
 * kit build made elsewhere, which `build` points at. Built here, the module
 * first translates what the locales are missing when given `translate`, then
 * compiles the source messages and every locale's translations at build
 * time and writes the kit's output — the `index` contract module, the
 * `bundles` loaders, each locale's bundle and the content documents — as
 * build templates under `prosary/`. Built elsewhere, the same `index` and
 * `bundles` modules re-export the build's own. Either way it serves the
 * content documents as static files, and registers the runtime plugin and
 * the `useProsary`, `useT`, `useLocale` and `useDocument` auto-imports, and
 * `<Prose>`, which renders a document with the app's overrides.
 *
 * A visitor gets one locale. The server picks it — their cookie, else the
 * best match for the languages their browser asks for, else the source
 * locale — and renders with that locale's bundle; the browser loads the same
. * bundle as its own chunk, and another only when the visitor switches.
 */
export default defineNuxtModule<NuxtProsaryConfig>({
  meta: {
    name: "prosary",
    configKey: "prosary",
  },
  setup: async (options, nuxt) => {
    const resolver = createResolver(import.meta.url);

    /*
     * The runtime files, resolved to the files they are. Nuxt writes the
     * types of the auto-imports and of `#imports` against these paths with
     * the extension stripped, and TypeScript resolves a bare path to a
     * `.d.ts` only, which is why the build emits `.js` with `.d.ts` rather
     * than `.mjs` with `.d.mts`.
     */
    const runtime = (name: string): Promise<string> =>
      resolver.resolvePath(`./runtime/${name}`);
    const files = {
      composable: await runtime("composable"),
      store: await runtime("store"),
      types: await runtime("types"),
      document: await runtime("document"),
      plugin: await runtime("plugin"),
      content: await runtime("server/content"),
    };

    const source = await loadSource(options, nuxt);

    /*
     * The kit's output, exactly as `prosary build` writes it. One generator —
     * the kit's — serves the CLI and this module, so an app importing
     * `#build/prosary/*` and a package importing a kit build see the same
     * files. The bundles are modules the `bundles` module imports lazily, so
     * the app's bundler gives each locale a chunk of its own. A build made
     * elsewhere is the same files already written: the templates re-export
     * its modules rather than generate them.
     */
    for (const file of source.files) {
      addTemplate({
        filename: `${MODULES}/${file.path}`,
        write: true,
        getContents: () => file.contents,
      });
    }

    /*
     * The content documents are files a page fetches, not modules it
     * imports: the build's copy is served as static assets, each
     * locale's documents under its own path, so a visitor downloads the
     * document they open in the locale they are in and nothing else.
     *
     * In development, Nitro serves static assets from outside its worker,
     * so a page rendered on the server would not find its document. The
     * same directory is then also mounted as a server asset and served by
     * a handler of the module, which answers the server's own fetch.
     */
    if (source.content !== undefined) {
      nuxt.options.nitro.publicAssets ||= [];
      nuxt.options.nitro.publicAssets.push({
        dir: source.content,
        baseURL: CONTENT_URL,
        // The paths carry no content hash, so a document must not outlive
        // the build that wrote it in a visitor's cache.
        maxAge: 0,
        // A miss falls through to the next handler instead of a 404: in
        // development, to the handler below.
        fallthrough: true,
      });
      if (nuxt.options.dev) {
        nuxt.options.nitro.serverAssets ||= [];
        nuxt.options.nitro.serverAssets.push({
          baseName: "prosary",
          dir: source.content,
        });
        addServerHandler({
          route: `${CONTENT_URL}/**`,
          handler: files.content,
        });
      }
    }

    /*
     * The overrides: the components in the overrides directory, as the map
     * `Prose` renders with. The directory is watched, so adding or
     * removing an override restarts dev and builds the map again.
     */
    const overrides = resolve(
      nuxt.options.srcDir,
      options.components ?? OVERRIDES,
    );
    nuxt.options.watch.push(overrides);
    for (const file of componentsModule(scanOverrides(overrides))) {
      addTemplate({
        filename: `${MODULES}/${file.path}`,
        write: true,
        getContents: () => file.contents,
      });
    }

    /*
     * `Prose`, the component that renders a document with the overrides.
     * Nuxt types a component by its path with the extension left off, which
     * reaches a `.ts` source but not the `.mjs` the build emits. Registered
     * through the build directory — a module that re-exports the runtime
     * file, with a declaration beside it — the component is typed either way.
     */
    const document = resolve(nuxt.options.buildDir, MODULES, "document");
    addTemplate({
      filename: `${MODULES}/document.mjs`,
      write: true,
      getContents: () =>
        `export { default } from ${JSON.stringify(files.document)};\n`,
    });
    addTemplate({
      filename: `${MODULES}/document.d.ts`,
      write: true,
      getContents: () =>
        `export { default } from ${JSON.stringify(files.document.replace(/\.ts$/, ""))};\n`,
    });
    addComponent({
      name: "Prose",
      filePath: `${document}.mjs`,
    });

    addPlugin({
      src: files.plugin,
    });

    addImports([
      ...["useProsary", "useT", "useLocale", "useDocument"].map((name) => ({
        from: files.composable,
        name,
      })),
      {
        from: files.store,
        name: "accessProsary",
      },
      ...[
        "AppProsaryContract",
        "AppProsaryLocale",
        "AppProsaryKey",
        "AppProsaryMessage",
        "AppProsaryDocument",
        "AppProsaryBundle",
        "AppProsaryConfig",
        "AppProsarySelection",
        "AppProsaryResolver",
        "AppProsary",
      ].map((name) => ({
        from: files.types,
        name,
        type: true,
      })),
    ]);
  },
});
