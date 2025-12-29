/**
 * Core HTTP execution engine.
 *
 * This function is responsible for performing the actual HTTP request
 * using a fetch-compatible implementation.
 *
 * Responsibilities:
 * - Resolve the final request URL using baseURL (if provided)
 * - Delegate execution to the provided fetcher
 * - Return parsed response data in a typed-safe manner
 *
 * Non-responsibilities:
 * - Business logic
 * - Retry handling
 * - Error classification
 * - Response domain validation
 *
 * Design guarantees:
 * - Side-effect free
 * - Framework-agnostic (Node, Edge, SSR)
 * - Safe for test environments via fetcher override
 *
 * This function must remain transport-only and immutable.
 */
import type { HttpClientConfig } from './httpConfig';
import { resolveUrl } from '../utils/urlResolverUtils';

export const httpClient = async <T = unknown>(
  config: HttpClientConfig & { url: string }
): Promise<T> => {
  const {
    url,
    baseURL,
    method = 'GET',
    headers,
    body,
    fetcher = fetch,
    ...rest
  } = config;

  const response = await fetcher(
    resolveUrl(baseURL, url),
    {
      ...rest,
      method: method.toUpperCase(),
      headers,
      body: body ? JSON.stringify(body) : undefined,
    }
  );

  return response.json() as Promise<T>;
};