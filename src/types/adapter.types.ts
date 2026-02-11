/**
 * Adapter interface for pluggable HTTP transports.
 * 
 * Adapters are responsible ONLY for executing HTTP requests and returning
 * normalized responses. No config merging, retries, transforms, or debug logic
 * should be implemented inside adapters.
 */

import { WciHttpConfig, HttpResponse } from './http.types';

/**
 * Adapter configuration object that represents the fully merged
 * and transformed request config ready for execution.
 */
export interface AdapterConfig extends WciHttpConfig {
  // Adapter receives the final config after all merging and transforms
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'stream';
  credentials?: RequestCredentials;
  fetcher?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

/**
 * Adapter response format that matches existing HttpResponse structure.
 * Adapters must return this standardized shape.
 */
export interface AdapterResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: AdapterConfig;
  request?: any;
}

/**
 * HTTP Adapter interface for pluggable transport implementations.
 * 
 * @template T The response data type
 */
export interface HttpAdapter {
  /**
   * Execute an HTTP request and return a normalized response.
   * 
   * @param config The fully merged and transformed request config
   * @returns Promise resolving to a normalized response
   * @throws Adapter-specific errors that will be normalized by the core pipeline
   */
  (config: AdapterConfig): Promise<AdapterResponse>;
}

/**
 * Adapter resolver function type for selecting appropriate adapter.
 */
export type AdapterResolver = (config?: WciHttpConfig) => HttpAdapter;