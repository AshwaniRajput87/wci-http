import { httpClient } from "../client/httpClient";

import type { WciHttpConfig } from "../types/http.types";

export const patch = <T = unknown>(
  url: string,
  data?: any,
  config: WciHttpConfig = {},
): Promise<T> => {
  return httpClient.request<T>({ ...config, method: 'patch', url, data });
};
