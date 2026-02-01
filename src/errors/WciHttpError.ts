import { ErrorCode } from "./createErrorCode";
import { HttpRequest } from "../types/http.types";

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

    Object.setPrototypeOf(this, WciHttpError.prototype);
  }

  toJSON() {
    const serializedConfig: Partial<HttpRequest> = {};
    if (this.config) {
      for (const key of ["url", "method", "headers", "timeoutMs", "responseType", "baseURL", "query"] as const) {
        if (this.config[key] !== undefined) {
          serializedConfig[key] = this.config[key];
        }
      }
    }

    const serializedRequest: Partial<HttpRequest> = {};
    if (this.request) {
      for (const key of ["url", "method", "headers", "timeoutMs", "responseType", "baseURL", "query"] as const) {
        if (this.request[key] !== undefined) {
          serializedRequest[key] = this.request[key];
        }
      }
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
