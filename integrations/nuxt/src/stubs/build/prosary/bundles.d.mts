// Typecheck-only stub for the generated `#build/prosary/bundles.mjs` virtual
// module.
import type { Bundle } from "prosary";
import type { Contract, Locale } from "./index.mjs";

export declare const bundles: {
  readonly [L in Locale]: () => Promise<Bundle<Contract>>;
};
