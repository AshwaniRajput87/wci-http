import { HTTP_METHODS } from "../constants/httpMethods";
import type { HttpMethod } from "../types/http.types";

const IDEMPOTENT_METHODS = new Set<HttpMethod>([
  HTTP_METHODS.GET,
  HTTP_METHODS.HEAD,
  HTTP_METHODS.OPTIONS,
  HTTP_METHODS.PUT,
  HTTP_METHODS.DELETE,
]);

export const isIdempotent = (method: HttpMethod): boolean => {
  const normalized = method.toUpperCase() as HttpMethod;
  return IDEMPOTENT_METHODS.has(normalized);
};
