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

export class WciHttpError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(options: WciHttpErrorOptions) {
    super(options.message);

    this.name = 'WciHttpError';
    this.code = options.code;
    this.status = options.status;
  }
}
