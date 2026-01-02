import type { HttpClientConfig } from "./httpConfig";
import { resolveUrl } from "../utils/urlResolverUtils";
import { loggingInterceptor } from "../interceptors/logging";
import { WciHttpError } from "../errors/WciHttpError";
import { getLogLevelFromStatus } from "../utils/logLevelUtils";

export const httpClient = async <T = unknown>(
  config: HttpClientConfig & { url: string },
): Promise<T> => {
  const {
    url,
    baseURL,
    method = "GET",
    headers,
    body,
    fetcher = fetch,
    logger,
    ...rest
  } = config;

  const finalUrl = resolveUrl(baseURL, url);
  const startTime = Date.now();

  // ---------- Request start log ----------
  loggingInterceptor(finalUrl, logger, {
    level: "info",
    method,
    message: `Sending ${method} request`,
  });

  try {
    // ---------- Body processing ----------
    const isRawBody =
      typeof body === "string" ||
      body instanceof FormData ||
      body instanceof Blob;

    const processedBody =
      body !== undefined && !isRawBody ? JSON.stringify(body) : body;

    // ---------- Fetch ----------
    const response = await fetcher(finalUrl, {
      ...rest,
      method: method.toUpperCase(),
      headers,
      body: processedBody,
    });

    const level = getLogLevelFromStatus(response.status);

    // ---------- HTTP error handling ----------
    if (!response.ok) {
      const error = new WciHttpError({
        code: `HTTP_${response.status}`,
        status: response.status,
        message: `Request failed with status ${response.status}`,
      });

      loggingInterceptor(finalUrl, logger, {
        level, // warn for 4xx, error for 5xx
        method,
        status: response.status,
        durationMs: Date.now() - startTime,
        message: "Request failed",
        error,
      });

      throw error;
    }

    // ---------- Success log ----------
    loggingInterceptor(finalUrl, logger, {
      level, // info for 2xx
      method,
      status: response.status,
      durationMs: Date.now() - startTime,
      message: "Request succeeded",
    });

    // ---------- No-body responses ----------
    if (method === "HEAD" || response.status === 204) {
      return undefined as T;
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength === "0") {
      return undefined as T;
    }

    // ---------- Parse JSON ----------
    return response.json() as Promise<T>;
  } catch (error) {
    // ---------- Network / unexpected errors ----------
    if (!(error instanceof WciHttpError)) {
      loggingInterceptor(finalUrl, logger, {
        level: "error",
        method,
        durationMs: Date.now() - startTime,
        message: "Request failed",
        error,
      });

      throw new WciHttpError({
        code: "NETWORK_ERROR",
        message: "Network request failed",
      });
    }

    throw error;
  }
};
