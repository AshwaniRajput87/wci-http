import type { HttpRequest } from "../types/http.types";

export interface SerializedBodyResult {
  body?: BodyInit;
  headers?: Record<string, string>;
}

export const serializeRequestBody = (
  request: HttpRequest,
): SerializedBodyResult => {
  const { body, headers = {} } = request;

  if (
    body === undefined ||
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof Blob
  ) {
    return { body };
  }

  // Axios-like default JSON handling
  return {
    body: JSON.stringify(body),
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
  };
};
