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
  code: string;
  message: string;
  cause?: unknown;
  status?: number;
  method?: string;
  url?: string;
  retryable?: boolean;
  timeout?: boolean;
}

/**
 * Strongly typed HTTP error with metadata.
 */
export class WciHttpError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly method?: string;
  readonly url?: string;
  readonly retryable?: boolean;
  readonly timeout?: boolean;
  readonly cause?: unknown;
  readonly isWciHttpError = true;

  constructor(options: WciHttpErrorOptions) {
    super(options.message);

    this.name = 'WciHttpError';
    this.code = options.code;
    this.status = options.status;
    this.method = options.method;
    this.url = options.url;
    this.retryable = options.retryable;
    this.timeout = options.timeout;
    this.cause = options.cause;

    Object.setPrototypeOf(this, WciHttpError.prototype);
  }

  toJSON() {
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
    };
  }
}
