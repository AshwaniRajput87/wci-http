/**
 * Controls how the response body is parsed.
 *
 * This is a client-side parsing instruction and is independent
 * of the server-provided Content-Type header.
 *
 * If specified, this value takes precedence over automatic
 * content-type based detection.
 *
 * Mirrors Axios responseType behavior.
 */

import { HTTP_METHODS } from "../constants/httpMethods";
import { LogLevel } from "./loggingTypes";
import { InterceptorManager } from "../interceptors/interceptorManager";
import { HttpAdapter } from "./adapter.types";


export type HttpMethod =
  (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];


export enum HttpLogEventType {
  REQUEST_START = "REQUEST_START",
  REQUEST_END = "REQUEST_END",
  REQUEST_ERROR = "REQUEST_ERROR",
  RESPONSE_SUCCESS = "RESPONSE_SUCCESS",
  RESPONSE_ERROR = "RESPONSE_ERROR",
  RETRY = "RETRY",
  TIMEOUT = "TIMEOUT",
  ABORT = "ABORT",
}

export interface HttpLogEvent {
  type: HttpLogEventType;
  level: LogLevel;
  category: string;
  message: string;
  url?: string;
  method?: HttpMethod;
  status?: number;
  durationMs?: number;
  error?: unknown;
  errorCode?: string;
  [key: string]: unknown;
}

export interface WciLogger {
  log: (event: HttpLogEvent) => void;
  error: (event: HttpLogEvent) => void;
  warn: (event: HttpLogEvent) => void;
  info: (event: HttpLogEvent) => void;
  debug: (event: HttpLogEvent) => void;
  trace: (event: HttpLogEvent) => void;
}


export type HttpHeaders = Record<string, string>;
export type HttpQuery = Record<string, string | number | boolean>;

export type TransformRequest = (
  data: any,
  headers: Record<string, any>,
) => any;

export interface ParamsSerializerOptions {
  indexes?: boolean | null;
  encode?: boolean;
  encodeValuesOnly?: boolean;
  arrayFormat?: "none" | "indices" | "brackets" | "repeat" | "comma";
}

export type ParamsSerializer = (
  params: Record<string, any>,
  options?: ParamsSerializerOptions,
) => string;

// Lightweight progress event shape shared by upload/download helpers
export type ProgressEvent = {
  loaded: number;
  total?: number;
  progress?: number; // 0-1
};

export interface HttpRequest {
  url: string;
  method?: HttpMethod;
  headers?: HttpHeaders;
  body?: unknown;
  data?: unknown;
  fetcher?: HttpClientFetcher;
  maxRetries?: number;
  timeoutMs?: number;
  baseURL?: string;
  query?: HttpQuery;
  params?: Record<string, any>;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'stream';
  credentials?: RequestCredentials;
  withCredentials?: boolean;
  logger?: WciLogger;
  signal?: AbortSignal;
  validateStatus?: (status: number) => boolean;
  transformResponse?: ((...args: any[]) => any) | ((...args: any[]) => any)[];
  transformRequest?: TransformRequest | TransformRequest[];
  adapter?: HttpAdapter;

  // Retry configuration
  retry?: {
    retries: number;
    delay: number;
    backoff: "fixed" | "exponential";
    retryOn: number[]; // HTTP status codes
    retryOnNetworkError: boolean;
  };
}

export type HttpRequestOptions =
  Omit<HttpRequest, "url" | "method" | "body">;


export interface HttpClientConfig {
  baseURL?: string;
  headers?: HttpHeaders;
  timeout?: number;
  credentials?: RequestCredentials;
  withCredentials?: boolean;
  params?: HttpQuery;
  fetcher?: HttpClientFetcher;
  method?: string;
  body?: any;
  logger?: WciLogger;
  validateStatus?: (status: number) => boolean;
  transformResponse?: ((...args: any[]) => any) | ((...args: any[]) => any)[];
  transformRequest?: TransformRequest | TransformRequest[];
}

export type HttpResponse<T = any> = {
  data: T;
  status: number;
  statusText: string;
  headers: HttpHeaders;
  config: WciHttpConfig;
  request?: any;
};

export type HttpClientFetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export interface RequestInterceptor {
  fulfilled?: (
    config: WciHttpConfig,
  ) => WciHttpConfig | Promise<WciHttpConfig>;
  rejected?: (error: any) => any;
  runWhen?: (config: WciHttpConfig) => boolean;
}

export interface ResponseInterceptor {
  fulfilled?: (
    response: HttpResponse,
  ) => HttpResponse | Promise<HttpResponse>;
  rejected?: (error: any) => any;
  runWhen?: (config: WciHttpConfig) => boolean;
}


export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  PARTIAL_CONTENT = 206,

  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  SEE_OTHER = 303,
  NOT_MODIFIED = 304,
  TEMPORARY_REDIRECT = 307,

  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  CONFLICT = 409,
  GONE = 410,
  LENGTH_REQUIRED = 411,
  PRECONDITION_FAILED = 412,
  PAYLOAD_TOO_LARGE = 413,
  URI_TOO_LONG = 414,
  UNSUPPORTED_MEDIA_TYPE = 415,
  RANGE_NOT_SATISFIABLE = 416,
  EXPECTATION_FAILED = 417,
  IM_A_TEAPOT = 418,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

// Define WciHttpConfig as a comprehensive type for instance and request configuration
export interface WciHttpConfig {
  url?: string;
  method?: HttpMethod;
  headers?: HttpHeaders;
  body?: unknown;
  data?: unknown;
  fetcher?: HttpClientFetcher;
  maxRetries?: number;
  timeoutMs?: number;
  baseURL?: string;
  query?: HttpQuery;
  params?: Record<string, any>;
  paramsSerializer?: ParamsSerializer;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'stream';
  credentials?: RequestCredentials;
  withCredentials?: boolean;
  logger?: WciLogger;
  signal?: AbortSignal;
  validateStatus?: (status: number) => boolean;
  transformResponse?: ((...args: any[]) => any) | ((...args: any[]) => any)[];
  transformRequest?: TransformRequest | TransformRequest[];
  adapter?: HttpAdapter;

  // Retry configuration
  retry?: {
    retries: number;
    delay: number;
    backoff: "fixed" | "exponential";
    retryOn: number[]; // HTTP status codes
    retryOnNetworkError: boolean;
  };

  // Logging configuration
  logging?: {
    level: LogLevel;
    logRequestHeaders: boolean;
    logResponseHeaders: boolean;
  };

  // Config-level interceptors (concatenated per request)
  requestInterceptors?: RequestInterceptor[];
  responseInterceptors?: ResponseInterceptor[];

  interceptors?: {
    request: InterceptorManager<WciHttpConfig>;
    response: InterceptorManager<HttpResponse>;
  };
}
