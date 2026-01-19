/**
 * Perform an HTTP GET request.
 *
 * Thin wrapper over the core httpClient.
 * Intended for simple GET calls with shared defaults.
 */

import { httpClient } from "../client/httpClient";
import { HTTP_METHODS } from "../constants/httpMethods";

import type {
  HttpClientConfig,
  HttpRequestOptions,
} from "../types/http.types";

export const get = <T = unknown>(
  url: string,
  options: HttpRequestOptions = {},
  instanceConfig: HttpClientConfig = {},
): Promise<T> => {
  const mergedConfig = {
    // instance-level defaults
    ...instanceConfig,

    // request-level overrides
    ...options,

    url,
    method: HTTP_METHODS.GET, 

    headers: {
      ...(instanceConfig.headers ?? {}),
      ...(options.headers ?? {}),
    },
  };

  return httpClient<T>(mergedConfig);
};
