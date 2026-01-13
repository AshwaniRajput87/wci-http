import { httpClient } from "../client/httpClient";
import type { HttpRequestOptions } from "../types/http.types";

export const optionsReq = <T = unknown>(
  url: string,
  options: HttpRequestOptions = {},
): Promise<T> =>
  httpClient<T>({
    ...options,
    url,
    method: "OPTIONS",
  });
