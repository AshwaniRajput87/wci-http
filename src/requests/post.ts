import { httpClient } from '../client/httpClient';

export function post(url: string, body: unknown) {
  return httpClient(url, {
    headers: { 'Content-Type': 'application/json' },
  });
}
