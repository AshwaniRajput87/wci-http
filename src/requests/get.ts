/**
 * Perform an HTTP GET request.
 *
 * Thin wrapper over the core httpClient.
 * Intended for simple GET calls with shared defaults.
 */
import { httpClient } from "../client/httpClient";
import type { HttpRequestOptions } from "../types/httpRequestOptionsTypes";

export const get = <T = unknown>(
  url: string,
  options: HttpRequestOptions = {},
): Promise<T> =>
  httpClient<T>({
    url,
    method: "GET",
    ...options,
  });
