import { WciHttpConfig } from '../types';

/**
 * Flattens the headers object from a merged configuration into a single
 * headers object that can be sent with the request. This mimics Axios's
 * header merging hierarchy.
 *
 * The merge order of precedence is:
 * 1. headers from `config.headers.common`
 * 2. headers from `config.headers[method]`
 * 3. top-level headers from `config.headers`
 *
 * @param config The deep-merged request configuration.
 * @returns A new object containing the final, flattened headers.
 */
export function flattenHeaders(config: WciHttpConfig): HeadersInit {
    const mergedHeaders: any = {};
    const method = config.method || 'get';
    const configHeaders = config.headers || {};

    // 1. Apply common headers
    if (configHeaders.common) {
        Object.assign(mergedHeaders, configHeaders.common);
    }

    // 2. Apply method-specific headers
    if (configHeaders[method]) {
        Object.assign(mergedHeaders, configHeaders[method]);
    }

    // 3. Apply top-level request headers, overwriting common/method headers
    for (const key in configHeaders) {
        if (!['common', 'get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(key)) {
            mergedHeaders[key] = configHeaders[key];
        }
    }
    return mergedHeaders;
}

/**
 * Finds a header in a `Headers` object or a plain object, case-insensitively.
 * @param headerName The name of the header to find.
 * @param headers The headers to search within.
 * @returns The header value or null if not found.
 */
export function findHeader(
  headerName: string,
  headers: Headers | Record<string, string> | undefined,
): string | null {
  if (!headers) {
    return null;
  }
  const lowerCaseHeaderName = headerName.toLowerCase();
  if (headers instanceof Headers) {
    // Headers.get() is case-insensitive by spec
    return headers.get(headerName);
  }
  for (const key in headers) {
    if (key.toLowerCase() === lowerCaseHeaderName) {
      return headers[key];
    }
  }
  return null;
}

    