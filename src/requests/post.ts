import { httpClient } from "../client/httpClient";
import type { HttpRequestOptions } from "../types/httpRequestOptionsTypes";
import { CONTENT_TYPES } from "../constants/protocol/contentTypes";

/**
 * Perform an HTTP POST request.
 */
export const post = <T = unknown>(
  url: string,
  body?: unknown,
  options: HttpRequestOptions = {},
): Promise<T> => {
  const headers: Record<string, string> = { ...options.headers };

  const isSpecialBody =
    (typeof FormData !== "undefined" && body instanceof FormData) ||
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

  return httpClient<T>({
    ...options, // 1. User options go FIRST
    url, // 2. Hardcoded URL goes LATER (wins)
    method: "POST", // 3. Hardcoded Method goes LATER (wins)
    body, // 4. Hardcoded Body goes LATER (wins)
    headers, // 5. Hardcoded Headers goes LATER (wins)
  });
};
