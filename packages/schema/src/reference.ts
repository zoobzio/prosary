import type { Target } from "./types";

import { REFERENCE_PREFIX } from "./constant";

/**
 * Parses a reference string. `doc:guide#setup` names a document and a node.
 * `doc:guide` names a document. `#setup` names a node of the same document.
 * Returns `undefined` for a string in no such form, or with an empty name.
 */
export const parseReference = (v: string): Target | undefined => {
  if (v.startsWith(REFERENCE_PREFIX)) {
    const rest = v.slice(REFERENCE_PREFIX.length);
    const hash = rest.indexOf("#");
    const document = hash === -1 ? rest : rest.slice(0, hash);
    const node = hash === -1 ? undefined : rest.slice(hash + 1);
    if (!document || node === "") {
      return undefined;
    }
    return node === undefined ? { document } : { document, node };
  }
  if (v.startsWith("#")) {
    const node = v.slice(1);
    return node ? { node } : undefined;
  }
  return undefined;
};
