/**
 * The build-directory folder the module writes the kit's output into — the
 * same `index` and `bundles` modules, locale bundles and content documents
 * `prosary build` writes to its output directory, importable in the app as
 * `#build/prosary/index.mjs` and `#build/prosary/bundles.mjs`.
 */
export const MODULES = "prosary";

/**
 * The folder of a kit build its content documents sit under:
 * `content/<locale>/<path>`. The kit's own `CONTENT`, repeated here so a
 * build made elsewhere is used without the kit installed.
 */
export const CONTENT = "content";

/** The cookie the visitor's locale is kept in. */
export const LOCALE_COOKIE = "prosary-locale";

/** The cookie the visitor's time zone is kept in. */
export const TIME_ZONE_COOKIE = "prosary-time-zone";

/** The cookie the visitor's convention is kept in. */
export const CONVENTION_COOKIE = "prosary-convention";

/**
 * Where the built content documents are served from, as static files:
 * `{CONTENT_URL}/<locale>/<path>`.
 */
export const CONTENT_URL = "/_prosary/content";

/**
 * The directory of overrides, relative to the source directory, when the config
 * names none: components that render in place of elements and directives.
 */
export const OVERRIDES = "components/prose";
