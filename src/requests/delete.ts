import { httpClient } from "../client/httpClient";
import type { HttpClientConfig, HttpRequestOptions } from "../types/http.types";

export const del = <T = unknown>(
  url: string,
  options: HttpRequestOptions = {},
  instanceConfig: HttpClientConfig = {},
): Promise<T> => {
  const mergedConfig = {
    ...instanceConfig,
    ...options,
    url,
    method: "DELETE",
    headers: { ...instanceConfig.headers, ...options.headers },
  };
  return httpClient<T>(mergedConfig);
};
