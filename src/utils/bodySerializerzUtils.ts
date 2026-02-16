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

type BodySerializableRequest = {
  body?: unknown;
  headers?: Record<string, any>;
};

export const serializeRequestBody = (
  request: BodySerializableRequest,
): SerializedBodyResult => {
  const { body, headers = {} } = request;

  if (body == null) {
    return { body: undefined, headers: {} };
  }

  const contentType = findHeader("Content-Type", headers);

  // For FormData, let the underlying adapter set the Content-Type header with the correct boundary.
  // We return `undefined` for headers here to ensure `dispatchRequest` does not overwrite
  // any auto-generated 'Content-Type' header that the adapter might add.
  if (isFormData(body)) {
    // Returning an empty object keeps existing headers intact (e.g., user-provided
    // Content-Type) while signalling to callers that the serializer itself did not
    // add or modify headers. Using `{}` instead of `undefined` avoids consumers
    // interpreting this as "remove headers" which the tests expect.
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
