import { ParamsSerializer } from '../types/http.types';
import { defaultParamsSerializer } from './paramsSerializer';
import { resolveUrl } from './urlResolverUtils';

/**
 * Build a complete URL with query parameters.
 * 
 * Combines baseURL, url, and serialized query parameters
 * following Axios URL construction semantics.
 */
export function buildURL(
  url: string,
  params?: Record<string, any>,
  paramsSerializer?: ParamsSerializer,
  baseURL?: string
): string {
  // Resolve the base URL and relative URL
  const resolvedUrl = resolveUrl(baseURL, url);

  // If no params, return the resolved URL as-is
  if (!params || Object.keys(params).length === 0) {
    return resolvedUrl;
  }

  // Use custom serializer if provided, otherwise use default
  const serializer = paramsSerializer || defaultParamsSerializer;
  const serializedParams = serializer(params);

  // If serialization resulted in empty string, return base URL
  if (!serializedParams) {
    return resolvedUrl;
  }

  // Check if URL already has query parameters
  const hashIndex = resolvedUrl.indexOf('#');
  const urlWithoutHash = hashIndex === -1 ? resolvedUrl : resolvedUrl.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : resolvedUrl.slice(hashIndex);

  const hasQueryParams = urlWithoutHash.includes('?');
  const separator = hasQueryParams ? '&' : '?';

  return `${urlWithoutHash}${separator}${serializedParams}${hash}`;
}