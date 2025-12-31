import type { WciLogger } from "./loggingTypes";

export interface HttpRequestOptions {
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean>;
  signal?: AbortSignal;
  timeoutMs?: number;
  logger?: WciLogger;
}
