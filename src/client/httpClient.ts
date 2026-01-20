import { HTTP_METHODS } from "../constants/httpMethods";
import type { HttpMethod, HttpRequest } from "../types/http.types";

import { resolveUrl } from "../utils/urlResolverUtils";
import { sleep } from "../utils/sleepUtils";
import { serializeRequestBody } from "../utils/bodySerializerzUtils";
import { parseResponseBody } from "../utils/parseResponseBody";

import { WciHttpError } from "../errors/WciHttpError";
import { createHttpErrorCodes } from "../errors/httpErrorCodes";

import { isIdempotent } from "../retries/isIdempotentInteceptor";
import { calculateRetryDelay } from "../retries/retryDelayInterceptor";

import { applyRequestInterceptors } from "../interceptors/applyRequestInterceptors";
import { applyResponseInterceptors } from "../interceptors/applyResponseInterceptors";

import { createTimeoutController } from "../requests/timeoutController";
import { executeFetch } from "../requests/executeFetch";

const httpErrorCodes = createHttpErrorCodes();

export const httpClient = async <T = unknown>(
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

      if (!response.ok) {
        throw new WciHttpError({
          code: `HTTP_${response.status}`,
          status: response.status,
          message: `Request failed with status ${response.status}`,
          url: request.url,
          method: request.method,
        });
      }

      if (request.method === HTTP_METHODS.HEAD || response.status === 204) {
        return undefined as T;
      }

      if (response.headers.get("content-length") === "0") {
        return undefined as T;
      }

      try {
        return (await parseResponseBody(response)) as T;
      } catch (err) {
        if (err instanceof WciHttpError) {
          throw err;
        }

        throw new WciHttpError({
          code: httpErrorCodes.INVALID_JSON,
          message: "Failed to parse response body",
          url: request.url,
          method: request.method,
          cause: err,
        });
      }
    } catch (error: unknown) {
      if (error instanceof WciHttpError) {
        throw error;
      }

      let generatedError: WciHttpError;

      if (
        (error as any)?.name === "AbortError" ||
        (error as any)?.name === "TimeoutError"
      ) {
        generatedError = new WciHttpError({
          code: httpErrorCodes.TIMEOUT,
          message: "Request timed out",
          url: request.url,
          method: request.method,
          timeout: true,
          cause: error,
        });
      } else {
        generatedError = new WciHttpError({
          code: httpErrorCodes.NETWORK_ERROR,
          message: "Network request failed",
          url: request.url,
          method: request.method,
          cause: error,
        });
      }

      lastError = generatedError;

      const shouldRetry =
        retry &&
        attempt < maxRetries &&
        isIdempotent(request.method!) &&
        (generatedError.code === httpErrorCodes.NETWORK_ERROR ||
          generatedError.code === httpErrorCodes.TIMEOUT);

      if (!shouldRetry) {
        throw generatedError;
      }

      await sleep(calculateRetryDelay(retryDelayMs, attempt));
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
