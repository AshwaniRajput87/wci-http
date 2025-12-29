/**
 * Perform an HTTP POST request.
 *
 * Sends JSON payload using the shared httpClient.
 * Automatically applies `Content-Type: application/json`.
 */
import { httpClient } from '../client/httpClient';
import type { HttpRequestOptions } from '../types/httpRequestOptionsTypes';

export const post = <T = unknown>(
  url: string,
  body?: unknown,
  options: HttpRequestOptions = {}
): Promise<T> => {
  const headers: Record<string, string> = { ...options.headers };

  const isSpecialBody =
    (typeof FormData !== 'undefined' && body instanceof FormData) ||
    (typeof Blob !== 'undefined' && body instanceof Blob) ||
    (typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer) ||
    (typeof ReadableStream !== 'undefined' && body instanceof ReadableStream);

  const isUrlEncoded = 
    typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams;

  if (body !== undefined && !isSpecialBody && !headers['Content-Type']) {
    headers['Content-Type'] = isUrlEncoded
      ? 'application/x-www-form-urlencoded'
      : 'application/json';
  }

  return httpClient<T>({
    url,
    method: 'POST',
    body,
    ...options,
    headers,
  });
};
