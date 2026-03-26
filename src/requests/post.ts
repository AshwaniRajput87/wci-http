import { httpClient } from "../client/httpClient";
import { HTTP_METHODS } from "../constants/httpMethods";
import { CONTENT_TYPES } from "../constants/protocol/contentTypes";

import type {
  HttpClientConfig,
  HttpRequestOptions,
} from "../types/http.types";

/**
 * Perform an HTTP POST request.
 */
export const post = <T = unknown>(
  url: string,
  body?: unknown,
  options: HttpRequestOptions = {},
  instanceConfig: HttpClientConfig = {},
): Promise<T> => {
  const headers: Record<string, string> = {
    ...(instanceConfig.headers ?? {}),
    ...(options.headers ?? {}),
  };

  const isFormDataLike = (value: unknown): value is FormData => {
    if (value == null) return false;
    const tag = (value as any)?.[Symbol.toStringTag];
    const toString = Object.prototype.toString.call(value);
    const isTaggedFormData = tag === "FormData" || toString === "[object FormData]";
    const isTaggedUrlParams = tag === "URLSearchParams" || toString === "[object URLSearchParams]";

    if (isTaggedUrlParams) return false;
    if (typeof (value as any).append === "function") return true;
    if (typeof FormData !== "undefined" && value instanceof FormData) return true;
    return isTaggedFormData;
  };

  const isSpecialBody =
    isFormDataLike(body) ||
    (typeof Blob !== "undefined" && body instanceof Blob) ||
    (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer) ||
    (typeof ReadableStream !== "undefined" && body instanceof ReadableStream);

  const isUrlEncoded =
    typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams;

  if (body !== undefined && !isSpecialBody && !headers["Content-Type"]) {
    headers["Content-Type"] = isUrlEncoded
      ? CONTENT_TYPES.FORM
      : CONTENT_TYPES.JSON;
  }

  const mergedConfig = {
    ...instanceConfig,
    ...options,

    url,
    method: HTTP_METHODS.POST, 
    body,
    headers,
  };

  return httpClient<T>(mergedConfig);
};
