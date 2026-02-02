import { httpClient } from "../client/httpClient";
import type { WciHttpConfig } from "../types/http.types";

export const del = <T = unknown>(
  url: string,
  config: WciHttpConfig = {},
): Promise<T> => {
  return httpClient.request<T>({ ...config, method: 'delete', url });
};

