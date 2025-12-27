/**
 * Perform an HTTP GET request.
 *
 * Thin wrapper over the core httpClient.
 * Intended for simple GET calls with shared defaults.
 */
import { httpClient } from '../client/httpClient';

export const get = (url: string) => {
  return httpClient(url);
};
