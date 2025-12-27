/**
 * Creates a reusable error code factory.
 *
 * Error codes follow a strict convention:
 * PREFIX_DOMAIN_KEY
 *
 * Example:
 *   WCI_HTTP_TIMEOUT
 *   ACME_AUTH_INVALID
 */
export const createErrorCodeFactory =
  (defaultPrefix = 'WCI') =>
  (domain: string, key: string): string =>
    [defaultPrefix, domain, key]
      .map(v =>
        v
          .trim()
          .replace(/\s+/g, '_')
          .replace(/[^A-Z0-9_]/gi, '')
          .toUpperCase()
      )
      .join('_');
