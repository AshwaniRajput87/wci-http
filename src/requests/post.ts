/**
 * Perform an HTTP POST request.
 *
 * Sends JSON payload using the shared httpClient.
 * Automatically applies `Content-Type: application/json`.
 */
import { httpClient } from '../client/httpClient';

export const post = (url: string, _body: unknown) => {
  return httpClient(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
