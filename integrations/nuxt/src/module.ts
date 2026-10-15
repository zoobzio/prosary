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
          handler: resolver.resolve("./runtime/server/content"),
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
    addComponent({
      name: "Prose",
      filePath: resolver.resolve("./runtime/document"),
    });

    addPlugin({
      src: resolver.resolve("./runtime/plugin"),
    });

    addImports([
      ...["useProsary", "useT", "useLocale", "useDocument"].map((name) => ({
        from: resolver.resolve("./runtime/composable"),
        name,
      })),
      {
        from: resolver.resolve("./runtime/store"),
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
        from: resolver.resolve("./runtime/types"),
        name,
        type: true,
      })),
    ]);
  },
});
