import { httpClient } from "../client/httpClient";
import { HTTP_METHODS } from "../constants/httpMethods";

import type {
  HttpClientConfig,
  HttpRequestOptions,
} from "../types/http.types";

import { resolveBodyAndHeaders } from "../utils/bodyUtils";

export const patch = <T = unknown>(
  url: string,
  body?: unknown,
  options: HttpRequestOptions = {},
  instanceConfig: HttpClientConfig = {},
): Promise<T> => {
  const mergedHeaders = {
    ...(instanceConfig.headers ?? {}),
    ...(options.headers ?? {}),
  };

  const finalHeaders = resolveBodyAndHeaders(body, mergedHeaders);

  const mergedConfig = {
    ...instanceConfig,
    ...options,

    url,
    method: HTTP_METHODS.PATCH, 
    body,
    headers: finalHeaders,
  };

  return httpClient<T>(mergedConfig);
};
