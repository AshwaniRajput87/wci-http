/**
 * Canonical content-type constants for HTTP requests and responses.
 *
 * This module defines a normalized set of MIME types used across
 * the HTTP transport layer to ensure consistency and correctness.
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM: 'application/x-www-form-urlencoded',
  MULTIPART: 'multipart/form-data',
  TEXT: 'text/plain',
  OCTET_STREAM: 'application/octet-stream',
  IMAGE: 'image/',
  AUDIO: 'audio/',
  VIDEO: 'video/*',
  EVENT_STREAM: 'text/event-stream',
} as const;

export type ContentType =
  | typeof CONTENT_TYPES[keyof typeof CONTENT_TYPES]
  | `${'image' | 'audio' | 'video'}/${string}`;
