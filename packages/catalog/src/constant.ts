/**
 * The path segments the wire protocol hangs off a client's base URL: the
 * message listing at `{base}/messages` and a bundle at
 * `{base}/messages/{locale}`; the content listing at `{base}/content` and a
 * document at `{base}/content/{locale}/{path}`.
 */
export const ROUTES = { messages: "messages", content: "content" } as const;
