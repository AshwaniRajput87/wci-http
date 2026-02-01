import { HTTP_METHODS } from "../constants/httpMethods";
import type { HttpMethod, HttpRequest, HttpClient, HttpRequestOptions } from "../types/http.types";
import { ErrorCode, createErrorCodeFactory } from '../errors/createErrorCode';
import { ERROR_DOMAINS } from "../errors/errorDomains";


import { resolveUrl } from "../utils/urlResolverUtils";
import { sleep } from "../utils/sleepUtils";
import { serializeRequestBody } from "../utils/bodySerializerzUtils";
import { parseResponseBody } from "../utils/parseResponseBody";

import { WciHttpError } from "../errors/WciHttpError";
import { createHttpErrorCodes, HttpErrorCodes } from "../errors/httpErrorCodes";

import { isIdempotent } from "../retries/isIdempotentInteceptor";
import { calculateRetryDelay } from "../retries/retryDelayInterceptor";

import { applyRequestInterceptors } from "../interceptors/applyRequestInterceptors";
import { applyResponseInterceptors } from "../interceptors/applyResponseInterceptors";

import { createTimeoutController } from "../requests/timeoutController";
import { executeFetch } from "../requests/executeFetch";

const httpErrorCodes: HttpErrorCodes = createHttpErrorCodes();





const RETRYABLE_ERROR_CODES = new Set([
  httpErrorCodes.NETWORK_ERROR,
  httpErrorCodes.TIMEOUT,
  httpErrorCodes.TOO_MANY_REQUESTS,
  httpErrorCodes.INTERNAL_SERVER_ERROR,
  httpErrorCodes.BAD_GATEWAY,
  httpErrorCodes.SERVICE_UNAVAILABLE,
  httpErrorCodes.GATEWAY_TIMEOUT,
]);



const coreHttpClient = async <T = unknown>(
  config: HttpRequest,
): Promise<T> => {
  const { retry = false, maxRetries = 3, retryDelayMs = 1000 } = config;

  const finalUrl = resolveUrl(config.baseURL, config.url);

  const initialRequest: HttpRequest = {
    ...config,
    url: finalUrl,
    headers: config.headers ?? {},
  };

  let lastError: WciHttpError | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let request: HttpRequest = {
      ...initialRequest,
      headers: { ...initialRequest.headers },
    };

    try {
      request = await applyRequestInterceptors(request);

      const { signal, clear } = createTimeoutController(
        request.timeoutMs,
        request.signal,
      );

      const serialized = serializeRequestBody(request);

      const finalHeaders = {
        ...request.headers,
        ...serialized.headers,
      };

      let response = await executeFetch(
        request.fetcher ?? fetch,
        {
          ...request,
          headers: finalHeaders,
          method: (request.method ?? HTTP_METHODS.GET).toUpperCase() as HttpMethod,
        },
        serialized.body,
        signal,
      );

      response = await applyResponseInterceptors(response, request);
      clear();

      // Validate status using the provided or default validateStatus function
      const isValidStatus = request.validateStatus?.(response.status) ?? true;

      if (!isValidStatus) {
        let errorCode: ErrorCode;
        switch (response.status) {
          case 400: errorCode = httpErrorCodes.BAD_REQUEST; break;
          case 401: errorCode = httpErrorCodes.UNAUTHORIZED; break;
          case 403: errorCode = httpErrorCodes.FORBIDDEN; break;
          case 404: errorCode = httpErrorCodes.NOT_FOUND; break;
          case 409: errorCode = httpErrorCodes.CONFLICT; break;
          case 422: errorCode = httpErrorCodes.UNPROCESSABLE_ENTITY; break;
          case 429: errorCode = httpErrorCodes.TOO_MANY_REQUESTS; break;
          case 500: errorCode = httpErrorCodes.INTERNAL_SERVER_ERROR; break;
          case 502: errorCode = httpErrorCodes.BAD_GATEWAY; break;
          case 503: errorCode = httpErrorCodes.SERVICE_UNAVAILABLE; break;
          case 504: errorCode = httpErrorCodes.GATEWAY_TIMEOUT; break;
          default: errorCode = createErrorCodeFactory("WCI")(ERROR_DOMAINS.HTTP, `HTTP_${response.status}`); break;
        }

        throw new WciHttpError({
          code: errorCode,
          status: response.status,
          message: `Request failed with status ${response.status}`,
          url: request.url,
          method: request.method,
          config: initialRequest, // Original request config
          request: request, // Processed request config
          response: response, // Raw fetch response
        });
      }

      if (request.method === HTTP_METHODS.HEAD || response.status === 204) {
        return undefined as T;
      }

      if (response.headers.get("content-length") === "0") {
        return undefined as T;
      }

      try {
        let responseData = (await parseResponseBody(response, request)) as T;

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        // Apply transformResponse
        if (request.transformResponse) {
          const transformers = Array.isArray(request.transformResponse)
            ? request.transformResponse
            : [request.transformResponse];

          for (const transformer of transformers) {
            responseData = await Promise.resolve(
              transformer(responseData, responseHeaders, response.status),
            );
          }
        }
        return responseData;
      } catch (err) {
        // Here, err could be a WciHttpError (e.g., from networkUtils) or a parsing error
        let parseError: WciHttpError;
        if (err instanceof WciHttpError) {
          parseError = err;
        } else {
          parseError = new WciHttpError({
            code: httpErrorCodes.INVALID_RESPONSE, // Changed from INVALID_JSON for generality
            message: "Failed to parse response body",
            url: request.url,
            method: request.method,
            cause: err,
          });
        }
        throw parseError; // Always throw wrapped parse errors
      }
    } catch (error: unknown) {
      let errorCode: ErrorCode;
      let errorMessage: string;
      let errorCause: unknown = error;
      let isTimeout = false;

      // 1. Consolidate error transformation and determine the error code
      if (error instanceof WciHttpError) {
        // If it's already a WciHttpError, use its properties
        errorCode = error.code;
        errorMessage = error.message;
        errorCause = error.cause;
        isTimeout = error.timeout ?? false;
      } else if ((error as any)?.name === "AbortError") {
        // Distinguish between user-initiated cancellation and internal timeout
        if (config.signal?.aborted === true) {
          errorCode = httpErrorCodes.ABORTED;
          errorMessage = "Request aborted by user";
        } else {
          errorCode = httpErrorCodes.TIMEOUT;
          errorMessage = "Request timed out";
          isTimeout = true;
        }
      } else if ((error as any)?.name === "TimeoutError") {
        // Specific timeout errors from fetch implementations
        errorCode = httpErrorCodes.TIMEOUT;
        errorMessage = "Request timed out";
        isTimeout = true;
      } else {
        // Catch-all for network or other unclassified errors
        errorCode = httpErrorCodes.NETWORK_ERROR;
        errorMessage = "Network request failed";
      }

      // 2. Decide if the error is retryable
      const shouldRetry =
        retry &&
        attempt < maxRetries &&
        isIdempotent(request.method!) &&
        RETRYABLE_ERROR_CODES.has(errorCode);

      // 3. Create the final, comprehensive error object
      const finalError = new WciHttpError({
        code: errorCode,
        message: errorMessage,
        cause: errorCause,
        url: request.url,
        method: request.method,
        retryable: shouldRetry,
        timeout: isTimeout,
        status: (error instanceof WciHttpError) ? error.status : undefined,
        config: (error instanceof WciHttpError) ? error.config : undefined, // Propagate config
        request: (error instanceof WciHttpError) ? error.request : undefined, // Propagate request
        response: (error instanceof WciHttpError) ? error.response : undefined, // Propagate response
      });

      lastError = finalError;

      if (!shouldRetry) {
        throw finalError; // Throw if not retrying
      }

      await sleep(calculateRetryDelay(retryDelayMs, attempt)); // Wait before next attempt
    }
  }

  throw (
    lastError ??
    new WciHttpError({
      code: httpErrorCodes.UNKNOWN_ERROR,
      message: "Unknown error after retries",
      url: finalUrl,
      method: config.method,
    })
  );
};

export const httpClient: HttpClient = Object.assign(coreHttpClient, {
  get: <T = unknown>(url: string, config: HttpRequestOptions = {}): Promise<T> => {
    return coreHttpClient<T>({ ...config, url, method: HTTP_METHODS.GET });
  },
  post: <T = unknown>(url: string, data?: any, config: HttpRequestOptions = {}): Promise<T> => {
    return coreHttpClient<T>({ ...config, url, body: data, method: HTTP_METHODS.POST });
  },
  put: <T = unknown>(url: string, data?: any, config: HttpRequestOptions = {}): Promise<T> => {
    return coreHttpClient<T>({ ...config, url, body: data, method: HTTP_METHODS.PUT });
  },
  delete: <T = unknown>(url: string, config: HttpRequestOptions = {}): Promise<T> => {
    return coreHttpClient<T>({ ...config, url, method: HTTP_METHODS.DELETE });
  },
  patch: <T = unknown>(url: string, data?: any, config: HttpRequestOptions = {}): Promise<T> => {
    return coreHttpClient<T>({ ...config, url, body: data, method: HTTP_METHODS.PATCH });
  },
  head: <T = unknown>(url: string, config: HttpRequestOptions = {}): Promise<T> => {
    return coreHttpClient<T>({ ...config, url, method: HTTP_METHODS.HEAD });
  },
  options: <T = unknown>(url: string, config: HttpRequestOptions = {}): Promise<T> => {
    return coreHttpClient<T>({ ...config, url, method: HTTP_METHODS.OPTIONS });
  },
});

