import { ErrorCode } from "./createErrorCode";
import { HttpRequest, HttpMethod, HttpHeaders, HttpQuery } from "../types/http.types";

/**
 * Represents the serializable subset of an HttpRequest.
 * Only includes properties safe and relevant for JSON serialization.
 */
export type SerializableHttpRequest = {
  url?: string;
  method?: HttpMethod;
  headers?: HttpHeaders;
  timeoutMs?: number;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'stream';
  baseURL?: string;
  query?: HttpQuery;
  params?: Record<string, any>;
};

/**
 * Typed HTTP error used across the WCI HTTP client.
 *
 * This error standardizes failure handling by attaching:
 * - a stable error code
 * - optional HTTP metadata
 * - the original cause when available
 *
 * Designed to be serializable, predictable, and infra-safe.
 */
export interface WciHttpErrorOptions {
  code: string | ErrorCode;
  message: string;
  cause?: unknown;
  status?: number;
  method?: string;
  url?: string;
  retryable?: boolean;
  timeout?: boolean;
  config?: HttpRequest; // The original request configuration
  request?: HttpRequest; // The processed request config sent over the wire
  response?: Response; // The raw fetch response
  retry?: {
    attempted: number;
    maxRetries: number;
    exhausted: boolean;
  };
}

/**
 * Strongly typed HTTP error with metadata.
 */
export class WciHttpError extends Error {
  readonly code: ErrorCode;
  readonly status?: number;
  readonly method?: string;
  readonly url?: string;
  readonly retryable?: boolean;
  readonly timeout?: boolean;
  readonly cause?: unknown;
  readonly isWciHttpError = true;
  readonly config?: HttpRequest;
  readonly request?: HttpRequest;
  readonly response?: Response;
  readonly retry?: {
    attempted: number;
    maxRetries: number;
    exhausted: boolean;
  };

  constructor(options: WciHttpErrorOptions) {
    super(options.message);

    this.name = 'WciHttpError';
    this.code = options.code as ErrorCode;
    this.status = options.status;
    this.method = options.method;
    this.url = options.url;
    this.retryable = options.retryable;
    this.timeout = options.timeout;
    this.cause = options.cause;
    this.config = options.config;
    this.request = options.request;
    this.response = options.response;
    this.retry = options.retry;

    Object.setPrototypeOf(this, WciHttpError.prototype);
  }

  toJSON() {
    // Only serialize a safe and relevant subset of the config.
    const serializedConfig: SerializableHttpRequest = {};
    if (this.config) {
      if (this.config.url !== undefined) serializedConfig.url = this.config.url;
      if (this.config.method !== undefined) serializedConfig.method = this.config.method;
      if (this.config.headers !== undefined) serializedConfig.headers = this.config.headers;
      if (this.config.timeoutMs !== undefined) serializedConfig.timeoutMs = this.config.timeoutMs;
      if (this.config.responseType !== undefined) serializedConfig.responseType = this.config.responseType;
      if (this.config.baseURL !== undefined) serializedConfig.baseURL = this.config.baseURL;
      if (this.config.query !== undefined) serializedConfig.query = this.config.query;
      if (this.config.params !== undefined) serializedConfig.params = this.config.params;
    }

    // Only serialize a safe and relevant subset of the request.
    const serializedRequest: SerializableHttpRequest = {};
    if (this.request) {
      if (this.request.url !== undefined) serializedRequest.url = this.request.url;
      if (this.request.method !== undefined) serializedRequest.method = this.request.method;
      if (this.request.headers !== undefined) serializedRequest.headers = this.request.headers;
      if (this.request.timeoutMs !== undefined) serializedRequest.timeoutMs = this.request.timeoutMs;
      if (this.request.responseType !== undefined) serializedRequest.responseType = this.request.responseType;
      if (this.request.baseURL !== undefined) serializedRequest.baseURL = this.request.baseURL;
      if (this.request.query !== undefined) serializedRequest.query = this.request.query;
      if (this.request.params !== undefined) serializedRequest.params = this.request.params;
    }

    const serializedResponse: Record<string, any> = {};
    if (this.response) {
      serializedResponse.status = this.response.status;
      serializedResponse.statusText = this.response.statusText;
      serializedResponse.url = this.response.url;
      const headers: Record<string, string> = {};
      this.response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      serializedResponse.headers = headers;
    }

    return {
      name: this.name,
      code: this.code,
      message: this.message,
      status: this.status,
      method: this.method,
      url: this.url,
      retryable: this.retryable,
      timeout: this.timeout,
      cause: this.cause,
      isWciHttpError: this.isWciHttpError,
      config: Object.keys(serializedConfig).length > 0 ? serializedConfig : undefined,
      request: Object.keys(serializedRequest).length > 0 ? serializedRequest : undefined,
      response: Object.keys(serializedResponse).length > 0 ? serializedResponse : undefined,
      retry: this.retry,
    };
  }
}

/**
 * Type guard to check if an error is an instance of WciHttpError.
 * This function does not rely on `instanceof` and is tree-shakeable.
 *
 * @param error The error to check.
 * @returns True if the error is a WciHttpError, false otherwise.
 */
export function isWciHttpError(error: any): error is WciHttpError {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as WciHttpError).isWciHttpError === true
  );
}

