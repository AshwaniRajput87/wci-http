import { HTTP_METHODS } from "../constants/httpMethods";
import type { HttpMethod, HttpRequest } from "../types/http.types";

import { resolveUrl } from "../utils/urlResolverUtils";
import { sleep } from "../utils/sleepUtils";
import { serializeRequestBody } from "../utils/bodySerializerzUtils";

import { WciHttpError } from "../errors/WciHttpError";
import { createHttpErrorCodes } from "../errors/httpErrorCodes";

import { isIdempotent } from "../retries/isIdempotentInteceptor";
import { calculateRetryDelay } from "../retries/retryDelayInterceptor";

import { applyRequestInterceptors } from "../interceptors/applyRequestInterceptors";
import { applyResponseInterceptors } from "../interceptors/applyResponseInterceptors";

import { createTimeoutController } from "../requests/timeoutController";
import { executeFetch } from "../requests/executeFetch";

const httpErrorCodes = createHttpErrorCodes();

/**
 * Core Axios-like HTTP client built on Fetch
 */
export const httpClient = async <T = unknown>(
  config: HttpRequest,
): Promise<T> => {
  const {
    retry = false,
    maxRetries = 3,
    retryDelayMs = 1000,
  } = config;

  const finalUrl = resolveUrl(config.baseURL, config.url);

  const initialRequest: HttpRequest = { 
    ...config,
    url: finalUrl,
    headers: config.headers ?? {}, // INIT HEADERS
  };

  let lastError: WciHttpError | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let request: HttpRequest = {
      ...initialRequest,
      headers: { ...initialRequest.headers }, // ✅ CLONE HEADERS PER RETRY
    };

    try {
      /* ---------------------------------------
         1️⃣ Apply request interceptors
      --------------------------------------- */
      request = await applyRequestInterceptors(request);

      /* ---------------------------------------
         2️⃣ Timeout + Abort handling
      --------------------------------------- */
      const { signal, clear } = createTimeoutController(
        request.timeoutMs,
        request.signal,
      );

      /* ---------------------------------------
         3️⃣ Body serialization (SAFE MERGE)
      --------------------------------------- */
      const serialized = serializeRequestBody(request);

      const finalHeaders = {
        ...request.headers,
        ...serialized.headers, // ✅ DO NOT OVERRIDE AUTH
      };

      /* ---------------------------------------
         4️⃣ Execute fetch
      --------------------------------------- */
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

      /* ---------------------------------------
         5️⃣ Apply response interceptors
      --------------------------------------- */
      response = await applyResponseInterceptors(response, request);
      clear();

      /* ---------------------------------------
         6️⃣ HTTP error handling
      --------------------------------------- */
      if (!response.ok) {
        throw new WciHttpError({
          code: `HTTP_${response.status}`,
          status: response.status,
          message: `Request failed with status ${response.status}`,
          url: request.url,
          method: request.method,
        });
      }

      /* ---------------------------------------
         7️⃣ No-body responses
      --------------------------------------- */
      if (request.method === HTTP_METHODS.HEAD || response.status === 204) {
        return undefined as T;
      }

      const contentLength = response.headers.get("content-length");
      if (contentLength === "0") {
        return undefined as T;
      }

      /* ---------------------------------------
         8️⃣ Parse JSON (Axios-like default)
      --------------------------------------- */
      return (await response.json()) as T;
    } catch (error: unknown) {
      let generatedError: WciHttpError;

      if (error instanceof WciHttpError) {
        generatedError = error;
      } else if (
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

      /* ---------------------------------------
         9️⃣ Retry decision
      --------------------------------------- */
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
