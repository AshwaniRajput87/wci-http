/**
 * Resolve final request URL.
 * - Absolute URLs are returned as-is
 * - Relative URLs are resolved against baseURL
 */
export const resolveUrl = (
  baseURL: string | undefined,
  url: string
): string => {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (!baseURL) {
    return url;
  }

  return new URL(url, baseURL).toString();
};
