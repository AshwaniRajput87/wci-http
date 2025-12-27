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
      message: error.message || 'Unknown error',
      cause: (error as any).cause,
      original: error,
    };
  }

  if (typeof error === 'string') {
    return { message: error, original: error };
  }

  return { message: 'Unknown error', original: error };
};
