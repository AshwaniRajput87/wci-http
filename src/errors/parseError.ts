/**
 * Normalizes any thrown value into a predictable error shape.
 *
 * Ensures all errors expose:
 * - a human-readable message
 * - the original thrown value
 * - an optional cause (when available)
 *
 * This function NEVER throws.
 */
export interface ParsedError {
  message: string;
  cause?: unknown;
  original: unknown;
}

export const parseError = (error: unknown): ParsedError => {
  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred',
      cause: (error as any).cause,
      original: error,
    };
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return {
      message: error,
      original: error,
    };
  }

  if (typeof error === 'number') {
    return {
      message: `Error code: ${error}`,
      original: error,
    };
  }

  if (error !== null && typeof error === 'object') {
    const errorWithMsg = error as { message?: unknown; cause?: unknown };
    if (typeof errorWithMsg.message === 'string' && errorWithMsg.message.trim().length > 0) {
      return {
        message: errorWithMsg.message,
        cause: errorWithMsg.cause,
        original: error,
      };
    }
  }

  return {
    message: 'Unknown error occurred',
    original: error,
  };
};