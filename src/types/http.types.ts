import { HTTP_METHODS } from "../constants/httpMethods";
import { LogLevel } from "./loggingTypes";


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

export interface HttpRequest {
  url: string;
  method?: HttpMethod;
  headers?: HttpHeaders;
  body?: unknown;
  fetcher?: HttpClientFetcher;
  maxRetries?: number;
  timeoutMs?: number;
  baseURL?: string;
  query?: HttpQuery;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'stream';
  credentials?: RequestCredentials;
  logger?: WciLogger;
  signal?: AbortSignal;
  requestInterceptors?: RequestInterceptor[];
  responseInterceptors?: ResponseInterceptor[];
  retry?: boolean;
  retryDelayMs?: number;
}

export type HttpRequestOptions =
  Omit<HttpRequest, "url" | "method" | "body">;

export interface HttpClient {
  <T = unknown>(config: HttpRequest): Promise<T>;
  get<T = unknown>(url: string, config?: HttpRequestOptions): Promise<T>;
  post<T = unknown>(url: string, data?: any, config?: HttpRequestOptions): Promise<T>;
  put<T = unknown>(url: string, data?: any, config?: HttpRequestOptions): Promise<T>;
  delete<T = unknown>(url: string, config?: HttpRequestOptions): Promise<T>;
  patch<T = unknown>(url: string, data?: any, config?: HttpRequestOptions): Promise<T>;
  head<T = unknown>(url: string, config?: HttpRequestOptions): Promise<T>;
  options<T = unknown>(url: string, config?: HttpRequestOptions): Promise<T>;
}


export interface HttpClientConfig {
  baseURL?: string;
  headers?: HttpHeaders;
  timeout?: number;
  credentials?: RequestCredentials;
  params?: HttpQuery;
  fetcher?: HttpClientFetcher;
  method?: string;
  body?: any;
  logger?: WciLogger;
}

export type HttpResponse<T> = {
  data: T;
  status: number;
  headers: HttpHeaders;
};

export type HttpClientFetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type RequestInterceptor = (
  request: HttpRequest,
) => HttpRequest | Promise<HttpRequest>;

export type ResponseInterceptor = (
  response: Response,
  request: HttpRequest,
) => Response | Promise<Response>;


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
