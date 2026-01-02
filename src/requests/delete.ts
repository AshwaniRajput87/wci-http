import { httpClient } from "../client/httpClient";
import type { HttpRequestOptions } from "../types/httpRequestOptionsTypes";

export const del = <T = unknown>(
  url: string,
  options: HttpRequestOptions = {},
): Promise<T> =>
  httpClient<T>({
    ...options,
    url,
    method: "DELETE",
  });
