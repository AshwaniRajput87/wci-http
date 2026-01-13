/**
 * Transport-level configuration contract for HTTP client execution.
 *
 * This interface defines immutable request configuration such as
 * base URL resolution, headers, and fetch implementation overrides.
 * It intentionally excludes business, domain, and retry concerns.
 */
import {
  HttpHeaders,
  HttpQuery,
  WciLogger,
} from "../types/http.types";

export interface HttpClientConfig {
  baseURL?: string;
  headers?: HttpHeaders;
  timeout?: number;
  credentials?: RequestCredentials;
  params?: HttpQuery;
  fetcher?: typeof fetch;
  method?: string;
  body?: any;
  logger?: WciLogger;
}
