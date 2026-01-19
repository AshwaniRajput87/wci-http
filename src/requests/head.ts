import { httpClient } from "../client/httpClient";
import { HTTP_METHODS } from "../constants/httpMethods";

import type {
  HttpClientConfig,
  HttpRequestOptions,
} from "../types/http.types";

/**
 * HEAD request
 * Axios-like wrapper with instance + request config merging
 */
export const head = <T = unknown>(
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
    method: HTTP_METHODS.HEAD, 

    headers: {
      ...(instanceConfig.headers ?? {}),
      ...(options.headers ?? {}),
    },
  };

  return httpClient<T>(mergedConfig);
};
