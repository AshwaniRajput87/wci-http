/**
 * Resolves a request URL using an optional baseURL.
 *
 * Rules:
 * - Absolute URLs are returned as-is.
 * - If baseURL is missing, the relative URL is returned unchanged.
 * - Otherwise, the URL is safely resolved against baseURL.
 *
 * Guarantees:
 * - Never throws.
 * - Prevents malformed or double-slash URLs.
 * - Works consistently across browser and Node environments.
 */

export const resolveUrl = (
  baseURL: string | undefined,
  url: string,
): string => {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (!baseURL) {
    return url;
  }

  try {
    const base = baseURL.endsWith("/") ? baseURL : `${baseURL}/`;
    const path = url.startsWith("/") ? url.slice(1) : url;
    return new URL(path, base).toString();
  } catch {
    return `${baseURL}/${url}`.replace(/([^:]\/)\/+/g, "$1");
  }
};
