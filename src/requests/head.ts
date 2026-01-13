import { httpClient } from "../client/httpClient";
import type { HttpRequestOptions } from "../types/http.types";

export const head = <T = unknown>(
  url: string,
  options: HttpRequestOptions = {},
): Promise<T> =>
  httpClient<T>({
    ...options,
    url,
    method: "HEAD",
  });
