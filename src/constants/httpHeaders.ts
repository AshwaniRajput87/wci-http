/**
 * Canonical HTTP header names used across the transport layer.
 *
 * This module centralizes commonly used HTTP headers to ensure
 * consistency, correctness, and shared vocabulary across systems.
 */
export const HTTP_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  ACCEPT: 'Accept',
  AUTHORIZATION: 'Authorization',
  CACHE_CONTROL: 'Cache-Control',
  PRAGMA: 'Pragma',
  REQUEST_ID: 'X-Request-Id',
  TRACE_ID: 'X-Trace-Id',
  TENANT_ID: 'X-Tenant-Id',
} as const;
