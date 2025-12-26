import { HttpClientConfig } from './httpConfig';

export async function httpClient(
  url: string,
  config: HttpClientConfig = {}
) {
  const response = await fetch(config.baseURL ? config.baseURL + url : url, {
    headers: config.headers,
  });

  return response.json();
}
