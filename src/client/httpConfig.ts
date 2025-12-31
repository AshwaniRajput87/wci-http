/**
 * Transport-level configuration contract for HTTP client execution.
 *
 * This interface defines immutable request configuration such as
 * base URL resolution, headers, and fetch implementation overrides.
 * It intentionally excludes business, domain, and retry concerns.
 */
import { WciLogger } from "../types/loggingTypes"; 

export interface HttpClientConfig {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
  credentials?: RequestCredentials;
  params?: Record<string, string | number | boolean>;
  fetcher?: typeof fetch;
  method?: string;
  body?: any;
  logger?: WciLogger; 
}
