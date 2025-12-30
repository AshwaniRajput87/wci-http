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
export type ErrorCode = string & { readonly __brand: 'ErrorCode' };

const normalize = (value: string, label: string): string => {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`[WCI] ${label} must be a non-empty string`);
  }

  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '_');
};

export const createErrorCodeFactory =
  (defaultPrefix = 'WCI') =>
  (domain: string, key: string): ErrorCode => {
    const code = [
      normalize(defaultPrefix, 'prefix'),
      normalize(domain, 'domain'),
      normalize(key, 'key')
    ]
      .join('_')
      .replace(/_{2,}/g, '_');

    return code as ErrorCode;
  };