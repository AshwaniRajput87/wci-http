/**
 * Safely retrieves the base URL from environment variables.
 * Supports both Node.js (process.env) and browser environments (import.meta.env).
 */
export const getBaseUrlFromEnv = (): string | undefined => {
  const ENV_KEY = "WCI_HTTP_BASE_URL";

  // Node.js / Bun / Deno
  if (typeof process !== "undefined" && process.env) {
    return process.env[ENV_KEY];
  }

  // Browser / Vite / ESM environments
  // @ts-expect-error -- import.meta.env is provided by bundlers like Vite
  if (typeof import.meta !== "undefined" && import.meta.env) {
    // @ts-expect-error -- env is not part of standard ImportMeta typing
    return import.meta.env[ENV_KEY];
  }

  return undefined;
};

