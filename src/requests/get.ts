/**
 * Perform an HTTP GET request.
 *
 * Thin wrapper over the core httpClient.
 * Intended for simple GET calls with shared defaults.
 */

import { httpClient } from "../client/httpClient";

import type { WciHttpConfig } from "../types/http.types";

export const get = <T = unknown>(
  url: string,
  config: WciHttpConfig = {},
): Promise<T> => {
  return httpClient.request<T>({ ...config, method: 'get', url });
};
