
import { HTTP_METHODS } from '../constants/httpMethods';
import {
  HttpMethod,
  WciHttpConfig,
  HttpResponse,
} from '../types/http.types';
import { ErrorCode, createErrorCodeFactory } from '../errors/createErrorCode';
import { ERROR_DOMAINS } from '../errors/errorDomains';
import { resolveUrl } from '../utils/urlResolverUtils';
import { sleep } from '../utils/sleepUtils';
import { serializeRequestBody } from '../utils/bodySerializerzUtils';
import { parseResponseBody } from '../utils/parseResponseBody';
import { WciHttpError } from '../errors/WciHttpError';
import {
  createHttpErrorCodes,
  HttpErrorCodes,
} from '../errors/httpErrorCodes';
import { isIdempotent } from '../retries/isIdempotentInteceptor';
import { calculateRetryDelay } from '../retries/retryDelayInterceptor';
import { createTimeoutController } from '../requests/timeoutController';
import { executeFetch } from '../requests/executeFetch';

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

export const dispatchRequest = async <T = any>(
  config: WciHttpConfig,
): Promise<HttpResponse<T>> => {
  const { maxRetries = 3, retryDelayMs = 1000 } = config;
  const retry =
    config.retry === true || (config.retry && config.retry.attempts > 0);

  const finalUrl = resolveUrl(config.baseURL, config.url);

  const initialRequest: WciHttpConfig = {
    ...config,
    url: finalUrl,
    headers: config.headers ?? {},
  };

  let lastError: WciHttpError | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let request: WciHttpConfig = {
      ...initialRequest,
      headers: { ...initialRequest.headers },
    };

    const method = (request.method || HTTP_METHODS.GET).toUpperCase();

    if (
      (method === HTTP_METHODS.POST ||
        method === HTTP_METHODS.PUT ||
        method === HTTP_METHODS.PATCH) &&
      request.data !== undefined &&
      request.body === undefined
    ) {
      request.body = request.data;
    }

    try {
      const { signal, clear } = createTimeoutController(
        request.timeoutMs,
        request.signal,
      );

      const serialized = serializeRequestBody(request as any);

      const finalHeaders = {
        ...request.headers,
        ...serialized.headers,
      };

      const response = await executeFetch(
        request.fetcher ?? fetch,
        {
          ...request,
          headers: finalHeaders,
          method: (request.method ??
            HTTP_METHODS.GET).toUpperCase() as HttpMethod,
        },
        serialized.body,
        signal,
      );

      clear();

      const isValidStatus =
        request.validateStatus?.(response.status) ??
        (response.status >= 200 && response.status < 300);

      if (!isValidStatus) {
        let errorCode: ErrorCode;
        switch (response.status) {
          case 400:
            errorCode = httpErrorCodes.BAD_REQUEST;
            break;
          case 401:
            errorCode = httpErrorCodes.UNAUTHORIZED;
            break;
          case 403:
            errorCode = httpErrorCodes.FORBIDDEN;
            break;
          case 404:
            errorCode = httpErrorCodes.NOT_FOUND;
            break;
          case 409:
            errorCode = httpErrorCodes.CONFLICT;
            break;
          case 422:
            errorCode = httpErrorCodes.UNPROCESSABLE_ENTITY;
            break;
          case 429:
            errorCode = httpErrorCodes.TOO_MANY_REQUESTS;
            break;
          case 500:
            errorCode = httpErrorCodes.INTERNAL_SERVER_ERROR;
            break;
          case 502:
            errorCode = httpErrorCodes.BAD_GATEWAY;
            break;
          case 503:
            errorCode = httpErrorCodes.SERVICE_UNAVAILABLE;
            break;
          case 504:
            errorCode = httpErrorCodes.GATEWAY_TIMEOUT;
            break;
          default:
            errorCode = createErrorCodeFactory('WCI')(
              ERROR_DOMAINS.HTTP,
              `HTTP_${response.status}`,
            );
            break;
        }

        throw new WciHttpError({
          code: errorCode,
          status: response.status,
          message: `Request failed with status ${response.status}`,
          url: request.url,
          method: request.method,
          config: initialRequest,
          request: request,
          response: response,
        });
      }

      if (request.method === HTTP_METHODS.HEAD || response.status === 204) {
        return {
          data: undefined as T,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers as unknown as Record<string, string>,
          config: initialRequest,
          request,
        };
      }

      if (response.headers.get('content-length') === '0') {
        return {
          data: undefined as T,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers as unknown as Record<string, string>,
          config: initialRequest,
          request,
        };
      }

      try {
        let responseData = (await parseResponseBody(
          response,
          request as any,
        )) as T;
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

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

        return {
          data: responseData,
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          config: initialRequest,
          request,
        };
      } catch (err) {
        let parseError: WciHttpError;
        if (err instanceof WciHttpError) {
          parseError = err;
        } else {
          parseError = new WciHttpError({
            code: httpErrorCodes.INVALID_RESPONSE,
            message: 'Failed to parse response body',
            url: request.url,
            method: request.method,
            cause: err,
          });
        }
        throw parseError;
      }
    } catch (error: unknown) {
      let errorCode: ErrorCode;
      let errorMessage: string;
      let errorCause: unknown = error;
      let isTimeout = false;

      if (error instanceof WciHttpError) {
        errorCode = error.code;
        errorMessage = error.message;
        errorCause = error.cause;
        isTimeout = error.timeout ?? false;
      } else if ((error as any)?.name === 'AbortError') {
        if (config.signal?.aborted === true) {
          errorCode = httpErrorCodes.ABORTED;
          errorMessage = 'Request aborted by user';
        } else {
          errorCode = httpErrorCodes.TIMEOUT;
          errorMessage = 'Request timed out';
          isTimeout = true;
        }
      } else if ((error as any)?.name === 'TimeoutError') {
        errorCode = httpErrorCodes.TIMEOUT;
        errorMessage = 'Request timed out';
        isTimeout = true;
      } else {
        errorCode = httpErrorCodes.NETWORK_ERROR;
        errorMessage = 'Network request failed';
      }

      const shouldRetry =
        retry &&
        attempt < maxRetries &&
        isIdempotent(request.method!) &&
        RETRYABLE_ERROR_CODES.has(errorCode);

      const finalError = new WciHttpError({
        code: errorCode,
        message: errorMessage,
        cause: errorCause,
        url: request.url,
        method: request.method,
        retryable: shouldRetry,
        timeout: isTimeout,
        status: error instanceof WciHttpError ? error.status : undefined,
        config:
          error instanceof WciHttpError ? error.config : undefined,
        request:
          error instanceof WciHttpError ? error.request : undefined,
        response:
          error instanceof WciHttpError ? error.response : undefined,
      });

      lastError = finalError;

      if (!shouldRetry) {
        throw finalError;
      }

      await sleep(calculateRetryDelay(retryDelayMs, attempt));
    }
  }

  throw (
    lastError ??
    new WciHttpError({
      code: httpErrorCodes.UNKNOWN_ERROR,
      message: 'Unknown error after retries',
      url: finalUrl,
      method: config.method,
    })
  );
};
