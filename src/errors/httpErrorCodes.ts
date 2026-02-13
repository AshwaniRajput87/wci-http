/**
 * HTTP error code factory.
 *
 * Generates prefix-aware, immutable HTTP error codes
 * following the standard format:
 *
 * PREFIX_DOMAIN_KEY
 *
 * Example:
 * WCI_HTTP_TIMEOUT
 * ACME_HTTP_NETWORK_ERROR
 *
 * Clients may override the prefix,
 * but domains and keys remain canonical.
 */
import { HTTP_ERROR_KEYS } from "./errorCatalog";
import { createErrorCodeFactory } from "./createErrorCode";
import { ERROR_DOMAINS } from "./errorDomains";

export const createHttpErrorCodes = (prefix = "WCI") => {
  const create = createErrorCodeFactory(prefix);
  const domain = ERROR_DOMAINS.HTTP;

  return {
    NETWORK_ERROR: create(domain, HTTP_ERROR_KEYS.NETWORK_ERROR),
    TIMEOUT: create(domain, HTTP_ERROR_KEYS.TIMEOUT),
    ABORTED: create(domain, HTTP_ERROR_KEYS.ABORTED),
    BAD_REQUEST: create(domain, HTTP_ERROR_KEYS.BAD_REQUEST),
    UNAUTHORIZED: create(domain, HTTP_ERROR_KEYS.UNAUTHORIZED),
    FORBIDDEN: create(domain, HTTP_ERROR_KEYS.FORBIDDEN),
    NOT_FOUND: create(domain, HTTP_ERROR_KEYS.NOT_FOUND),
    CONFLICT: create(domain, HTTP_ERROR_KEYS.CONFLICT),
    UNPROCESSABLE_ENTITY: create(domain, HTTP_ERROR_KEYS.UNPROCESSABLE_ENTITY),
    TOO_MANY_REQUESTS: create(domain, HTTP_ERROR_KEYS.TOO_MANY_REQUESTS),
    INTERNAL_SERVER_ERROR: create(
      domain,
      HTTP_ERROR_KEYS.INTERNAL_SERVER_ERROR,
    ),
    BAD_GATEWAY: create(domain, HTTP_ERROR_KEYS.BAD_GATEWAY),
    SERVICE_UNAVAILABLE: create(domain, HTTP_ERROR_KEYS.SERVICE_UNAVAILABLE),
    GATEWAY_TIMEOUT: create(domain, HTTP_ERROR_KEYS.GATEWAY_TIMEOUT),
    INVALID_JSON: create(domain, HTTP_ERROR_KEYS.INVALID_JSON),
    INVALID_RESPONSE: create(domain, HTTP_ERROR_KEYS.INVALID_RESPONSE),
    INVALID_REQUEST_CONFIG: create(domain, HTTP_ERROR_KEYS.INVALID_REQUEST_CONFIG),
    UNKNOWN_ERROR: create(domain, HTTP_ERROR_KEYS.UNKNOWN_ERROR),
  };
};

export type HttpErrorCodes = ReturnType<typeof createHttpErrorCodes>;
