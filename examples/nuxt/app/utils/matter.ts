/**
 * The front matter of a document, as the `matter` preset left it on the root
 * of the tree the build made: the YAML map, carried through translation with
 * the prose, so a title or an author reads in the visitor's locale while a
 * date stays the data it is.
 */
export type Matter = Record<string, unknown>;

/** The front matter of a tree; empty when the document has none. */
export const matterOf = (
  tree: { data?: { matter?: Matter } } | undefined,
): Matter => {
  return tree?.data?.matter ?? {};
};

/** A front matter value as text; empty when it is not a string. */
export const text = (value: unknown): string => {
  return typeof value === "string" ? value : "";
};

/**
 * A front matter date (`2026-10-02`) as an instant: the moment that day
 * begins, in UTC. Formatted with the `calendar` format, which reads in UTC
 * too, it is the same day in every time zone.
 */
export const day = (value: unknown): number => {
  const parsed = Date.parse(text(value));
  return Number.isNaN(parsed) ? 0 : parsed;
};
