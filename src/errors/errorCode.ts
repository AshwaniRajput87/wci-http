/**
 * Canonical HTTP error codes.
 *
 * Generates stable, domain-scoped error codes by combining:
 * - a fixed prefix (WCI)
 * - the HTTP error domain
 * - predefined error keys
 *
 * The resulting object is immutable to guarantee
 * consistency across the application.
 *
 * Example:
 * WCI_HTTP_TIMEOUT
 */

import { HTTP_ERROR_KEYS } from './errorCatalog';
import { createErrorCodeFactory } from './createErrorCode';
import { ERROR_DOMAINS } from './errorDomains';
import { mapValuesAndFreeze } from '../utils/objectUtils';

const createErrorCode = createErrorCodeFactory('WCI');

export const HTTP_ERROR_CODES = mapValuesAndFreeze(
  HTTP_ERROR_KEYS,
  (key) => createErrorCode(ERROR_DOMAINS.HTTP, key)
);

export type HttpErrorCodes = typeof HTTP_ERROR_CODES;