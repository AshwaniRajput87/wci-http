import type { HttpRequest } from "../types/http.types";
import { CONTENT_TYPES } from "../constants/protocol/contentTypes";
import { findHeader } from "./mergeHeadersUtils";

export interface SerializedBodyResult {
  body?: BodyInit;
  headers?: Record<string, string>;
}

const isFormData = (value: unknown): value is FormData => {
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

export const serializeRequestBody = (
  request: HttpRequest,
): SerializedBodyResult => {
  const { body, headers = {} } = request;

  if (body == null) {
    return { body: undefined, headers: {} };
  }

  const contentType = findHeader("Content-Type", headers);

  // For FormData, let the browser set the Content-Type header. Return empty headers.
  if (isFormData(body)) {
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
