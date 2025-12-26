export const HTTP_ERROR_KEYS = {
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
  UNAUTHORIZED: "UNAUTHORIZED",
} as const;

export type HttpErrorKey = keyof typeof HTTP_ERROR_KEYS;
