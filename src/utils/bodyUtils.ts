import { CONTENT_TYPES } from "../constants/protocol/contentTypes";

export const resolveBodyAndHeaders = (
  body: unknown,
  headers: Record<string, string> = {},
) => {
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

  return headers;
};
