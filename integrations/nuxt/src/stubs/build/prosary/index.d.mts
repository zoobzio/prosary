// Typecheck-only stub for the generated `#build/prosary/index.mjs` virtual
// module, in the shape `@prosary/kit` emits for the stub messages.
export type Locale = "en" | "fr" | "pt-BR";
export type Document = "intro.md" | "guide/start.md";
export type Key = "greeting" | "title" | "inbox" | "seen";
export interface Arguments {
  greeting: { name: string | number };
  title: Record<never, never>;
  inbox: { count: number };
  seen: { at: Date | number };
}
/**
 * The contract as a named type, so a declaration derived from `contract`
 * refers to it by name — and in an app, to the app's own — rather than
 * spelling out the shape of the stub.
 */
export interface Contract {
  readonly locale: "en";
  readonly locales: readonly Locale[];
  readonly messages: readonly Key[];
  readonly formats: {
    readonly number: Record<never, never>;
    readonly date: Record<never, never>;
    readonly time: Record<never, never>;
  };
  readonly arguments?: Arguments;
}
export declare const contract: Contract;
