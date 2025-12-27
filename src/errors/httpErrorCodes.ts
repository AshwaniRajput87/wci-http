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
import { HTTP_ERROR_KEYS } from './errorCatalog';
import { createErrorCodeFactory } from './createErrorCode';
import { ERROR_DOMAINS } from './errorDomains';

export const createHttpErrorCodes = (prefix = 'WCI') => {
  const create = createErrorCodeFactory(prefix);

  return {
    NETWORK_ERROR: create(ERROR_DOMAINS.HTTP, HTTP_ERROR_KEYS.NETWORK_ERROR),
    TIMEOUT: create(ERROR_DOMAINS.HTTP, HTTP_ERROR_KEYS.TIMEOUT),
  } as const;
};
