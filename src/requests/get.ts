import { httpClient } from '../client/httpClient';

export function get(url: string) {
  return httpClient(url);
}
