import type { HttpHeaders } from "../types/http.types";

/**
 * Finds a header in a case-insensitive manner.
 *
 * @param name The name of the header to find.
 * @param headers The headers object to search in.
 * @returns The header value or undefined if not found.
 */
export const findHeader = (
  name: string,
  headers: HttpHeaders,
): string | undefined => {
  const lowerCaseName = name.toLowerCase();
  const headerKey = Object.keys(headers).find(
    (key) => key.toLowerCase() === lowerCaseName,
  );
  return headerKey ? headers[headerKey] : undefined;
};
