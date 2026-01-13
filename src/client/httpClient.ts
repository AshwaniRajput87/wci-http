
import { HTTP_METHODS } from "../constants/httpMethods";
import type { HttpMethod } from "../types/http.types"; // Added type import
import {
  HttpRequest,
} from "../types/http.types";
import { resolveUrl } from "../utils/urlResolverUtils";
import { WciHttpError } from "../errors/WciHttpError";
import { createHttpErrorCodes } from "../errors/httpErrorCodes";
import { sleep } from "../utils/sleepUtils"; // Assuming sleepUtils is available

const httpErrorCodes = createHttpErrorCodes();

const isIdempotent = (method: HttpMethod): boolean => {
  const idempotentMethods: string[] = [HTTP_METHODS.GET, HTTP_METHODS.HEAD, HTTP_METHODS.OPTIONS, HTTP_METHODS.PUT, HTTP_METHODS.DELETE];
  return idempotentMethods.includes(method.toUpperCase());
};

/**
 * Core HTTP client function responsible for executing requests,
 * applying interceptors, and handling timeouts/errors.
 * @param config The HttpRequest configuration object.
 * @returns A Promise that resolves with the response body or rejects with a WciHttpError.
 */
export const httpClient = async <T = unknown>(
  config: HttpRequest,
): Promise<T> => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const {
    method = "GET",
    headers,
    body,
    fetcher = fetch,
    logger,
    timeoutMs: configTimeoutMs,
    signal: userSignal,
    requestInterceptors = [],
    responseInterceptors = [],
    retry: enableRetry = false,
    maxRetries = 3,
    retryDelayMs = 1000, // Default 1 second
    ...rest
  } = config;

  const finalUrl = resolveUrl(config.baseURL, config.url);
  const initialRequest: HttpRequest = { ...config, url: finalUrl }; // Store initial for retries

  let finalResponse: Response | undefined;
  let lastError: WciHttpError | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let currentRequest: HttpRequest = { ...initialRequest }; // Clone for each attempt
    let abortController: AbortController | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let finalSignal = userSignal;
    const startTime = Date.now();
    let currentTimeoutMs: number | undefined;

    try {
      // 1. Apply Request Interceptors
      for (const interceptor of requestInterceptors) {
        currentRequest = await Promise.resolve(interceptor(currentRequest));
      }

      // After request interceptors, re-extract properties for the fetch call
      const {
        method: interceptedMethod,
        headers: interceptedHeaders,
        body: interceptedBody,
        timeoutMs: interceptedTimeoutMs,
        signal: interceptedUserSignal,
        ...interceptedRest
      } = currentRequest;

      // Handle Timeout (after request interceptors potentially modified timeoutMs)
      currentTimeoutMs = interceptedTimeoutMs ?? configTimeoutMs; // Use intercepted value if available
      if (currentTimeoutMs) {
        abortController = new AbortController();
        timeoutId = setTimeout(() => {
          abortController?.abort();
        }, currentTimeoutMs);

        if (interceptedUserSignal) {
          // Chain user signal with timeout signal
          const originalAbort = interceptedUserSignal.onabort;
          interceptedUserSignal.onabort = (event) => {
            originalAbort?.call(interceptedUserSignal, event);
            abortController?.abort();
          };
          abortController.signal.onabort = () => {
            if (!interceptedUserSignal.aborted) {
              interceptedUserSignal.dispatchEvent(new Event("abort"));
            }
          };
        }
        finalSignal = abortController.signal;
      }

      // Body processing (if not handled by interceptors)
      const processedBody =
        interceptedBody !== undefined &&
        typeof interceptedBody !== "string" &&
        !(interceptedBody instanceof FormData) &&
        !(interceptedBody instanceof Blob)
          ? JSON.stringify(interceptedBody)
          : interceptedBody;

      // 2. Perform Fetch
      let response: Response = await fetcher(currentRequest.url, {
        ...interceptedRest,
        method: (interceptedMethod || HTTP_METHODS.GET).toUpperCase() as HttpMethod,
        headers: interceptedHeaders,
        body: processedBody,
        signal: finalSignal,
      });

      // 3. Apply Response Interceptors
      for (const interceptor of responseInterceptors) {
        response = await Promise.resolve(interceptor(response, currentRequest));
      }

      finalResponse = response;
      break; // Request successful, exit retry loop
    } catch (error: any) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      let generatedError: WciHttpError;
      if (error.name === "AbortError" || error.name === "TimeoutError") {
        generatedError = new WciHttpError({
          code: httpErrorCodes.TIMEOUT,
          message: `Request timed out after ${currentTimeoutMs}ms`,
          url: currentRequest.url,
          method: currentRequest.method,
          timeout: true,
          cause: error,
        });
      } else if (!(error instanceof WciHttpError)) {
        generatedError = new WciHttpError({
          code: httpErrorCodes.NETWORK_ERROR,
          message: "Network request failed",
          url: currentRequest.url,
          method: currentRequest.method,
          cause: error,
        });
      } else {
        generatedError = error;
      }

      lastError = generatedError;

      // Decide whether to retry
      const shouldRetry =
        enableRetry &&
        attempt < maxRetries &&
        (lastError.code === httpErrorCodes.NETWORK_ERROR ||
          lastError.code === httpErrorCodes.TIMEOUT) &&
        isIdempotent(currentRequest.method!);

      if (!shouldRetry) {
        throw lastError;
      }

      // Apply exponential backoff with jitter
      const delay = Math.min(
        retryDelayMs * Math.pow(2, attempt) + Math.random() * 100,
        5000 + Math.random() * 100, // Max delay ~5s
      );
      await sleep(delay);
    }
  }

  if (!finalResponse) {
    throw lastError || new WciHttpError({
      code: httpErrorCodes.UNKNOWN_ERROR,
      message: "An unknown error occurred after all retries.",
      url: finalUrl,
      method: initialRequest.method,
    });
  }

  // Final processing after all retries are done
  if (!finalResponse.ok) {
    throw new WciHttpError({
      code: `HTTP_${finalResponse.status}`,
      status: finalResponse.status,
      message: `Request failed with status ${finalResponse.status}`,
      url: finalUrl,
      method: initialRequest.method,
    });
  }

  // No-body responses
  if (initialRequest.method === "HEAD" || finalResponse.status === 204) {
    return undefined as T;
  }

  const contentLength = finalResponse.headers.get("content-length");
  if (contentLength === "0") {
    return undefined as T;
  }

  // Parse JSON
  return (await finalResponse.json()) as Promise<T>;
};
