import { httpClient } from "../client/httpClient";
import type { HttpRequestOptions } from "../types/httpRequestOptionsTypes";
import { resolveBodyAndHeaders } from "../utils/bodyUtils";

export const patch = <T = unknown>(
  url: string,
  body?: unknown,
  options: HttpRequestOptions = {},
): Promise<T> => {
  const headers = resolveBodyAndHeaders(body, { ...options.headers });

  return httpClient<T>({
    ...options,
    url,
    method: "PATCH",
    body,
    headers,
  });
};
