/**
 * Canonical error domains.
 *
 * Domains define **where** an error originated from.
 * They are combined with a prefix and error key to form
 * a stable, globally unique error code.
 *
 * Format:
 * PREFIX_DOMAIN_KEY
 * Example: WCI_HTTP_TIMEOUT
 */
export const ERROR_DOMAINS = Object.freeze({
  HTTP: "HTTP",
  AUTH: "AUTH",
  DOMAIN: "DOMAIN",
  STORAGE: "STORAGE",
  SYSTEM: "SYSTEM",
} as const);

export type ErrorDomain = (typeof ERROR_DOMAINS)[keyof typeof ERROR_DOMAINS];