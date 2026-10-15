import type { Client } from "./types";

import { FailedRequestError } from "./error";

/**
 * The requests a client catalog makes over the wire: a listing, which any
 * failure status fails — a catalog with no listing route is misconfigured,
 * not empty — and a retrieval, which a 404 answers as a miss and any other
 * failure status fails.
 *
 * @param client - Where to make requests, and what to send with them.
 * @param route - The path segment of the catalog's routes.
 */
export const wire = (client: Client, route: string) => {
  const root = `${client.base.replace(/\/+$/, "")}/${route}`;

  /*
   * One GET through the configured transport. The implementations are
   * method-called — an injected fetch on its config, the default on
   * `globalThis` — so neither runs detached from the `this` it needs.
   */
  const request = async (url: string): Promise<Response> => {
    const init = {
      headers: { accept: "application/json", ...client.headers },
    };
    if (client.fetch) {
      return client.fetch(url, init);
    }
    return globalThis.fetch(url, init);
  };

  const list = async (): Promise<unknown> => {
    const response = await request(root);
    if (!response.ok) {
      throw new FailedRequestError(root, response.status);
    }
    const value: unknown = await response.json();
    return value;
  };

  const get = async (...segments: string[]): Promise<unknown> => {
    const url = `${root}/${segments.map((segment) => encodeURIComponent(segment)).join("/")}`;
    const response = await request(url);
    if (response.status === 404) {
      return undefined;
    }
    if (!response.ok) {
      throw new FailedRequestError(url, response.status);
    }
    const value: unknown = await response.json();
    return value;
  };

  return { list, get };
};
