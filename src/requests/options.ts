import { httpClient } from "../client/httpClient";

import type { WciHttpConfig } from "../types/http.types";

/**
 * OPTIONS request
 * Axios-like wrapper with instance + request config merging
 */
export const optionsReq = <T = unknown>(
  url: string,
  config: WciHttpConfig = {},
): Promise<T> => {
  return httpClient.request<T>({ ...config, method: 'options', url });
};
