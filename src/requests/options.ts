import { httpClient } from "../client/httpClient";
import { HTTP_METHODS } from "../constants/httpMethods";

import type {
  HttpClientConfig,
  HttpRequestOptions,
} from "../types/http.types";

/**
 * OPTIONS request
 * Axios-like wrapper with instance + request config merging
 */
export const optionsReq = <T = unknown>(
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
    method: HTTP_METHODS.OPTIONS, 

    // headers must be merged carefully
    headers: {
      ...(instanceConfig.headers ?? {}),
      ...(options.headers ?? {}),
    },
  };

  return httpClient<T>(mergedConfig);
};
