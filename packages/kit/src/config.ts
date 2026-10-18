import type { KitConfig } from "./types";

export type { Model } from "@prosary/translate";

/**
 * Identity helper that types a `prosary.config.ts`.
 *
 * @param config - The kit config.
 * @returns The same config.
 */
export const defineConfig = <const T extends KitConfig>(config: T): T => config;
