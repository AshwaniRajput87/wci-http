import type { HttpRequest } from "../types/http.types";
import { CONTENT_TYPES } from "../constants/protocol/contentTypes";
import { findHeader } from "./mergeHeadersUtils";

export interface SerializedBodyResult {
  body?: BodyInit;
  headers?: Record<string, string>;
}

import type { HttpRequest } from "../types/http.types";
import { CONTENT_TYPES } from "../constants/protocol/contentTypes";
import { findHeader } from "./mergeHeadersUtils";

export interface SerializedBodyResult {
  body?: BodyInit;
  headers?: Record<string, string>;
}

export const serializeRequestBody = (
  request: HttpRequest,
): SerializedBodyResult => {
  const { body, headers = {} } = request;

  if (body == null) {
    return { body: undefined, headers: {} };
  }

  const contentType = findHeader("Content-Type", headers);

  // For FormData, let the browser set the Content-Type header. Return empty headers.
  if (body instanceof FormData) {
    return { body, headers: {} };
  }

  if (body instanceof URLSearchParams) {
    return {
      body,
      headers: contentType ? {} : { "Content-Type": CONTENT_TYPES.FORM },
    };
  }

  if (body instanceof Blob || body instanceof ArrayBuffer) {
    return {
      body,
      headers: contentType ? {} : { "Content-Type": CONTENT_TYPES.OCTET_STREAM },
    };
  }

  if (typeof body === "string") {
    return {
      body,
      headers: contentType ? {} : { "Content-Type": CONTENT_TYPES.TEXT },
    };
  }

  // For anything else (objects, arrays, booleans, numbers), default to JSON.
  return {
    body: JSON.stringify(body),
    headers: contentType ? {} : { "Content-Type": CONTENT_TYPES.JSON },
  };
};
