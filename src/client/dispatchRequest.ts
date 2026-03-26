/**
 * Adapter-based request dispatcher.
 * 
 * This file contains the core request pipeline that separates
 * orchestration from transport execution through the adapter system.
 */

import { HTTP_METHODS } from '../constants/httpMethods';
import { WciHttpConfig, HttpResponse } from '../types/http.types';
import { buildURL } from '../utils/buildURL';
import { WciHttpError } from '../errors/WciHttpError';
import { createHttpErrorCodes, HttpErrorCodes } from '../errors/httpErrorCodes';
import { defaultAdapterResolver } from '../adapters/adapterResolver';
import { HttpAdapter, AdapterConfig, AdapterResponse } from '../types/adapter.types';
import { serializeRequestBody } from '../utils/bodySerializerzUtils';
import { createTimeoutController } from '../requests/timeoutController';

const httpErrorCodes: HttpErrorCodes = createHttpErrorCodes();

/**
 * Core request dispatcher using the adapter system.
 * 
 * Pipeline: Config merge → transformRequest (placeholder) → URL building → request serialization
 *           → timeout/cancellation orchestration → adapter selection → adapter execution
 *           → response validation → response parsing → transformResponse → error normalization
 * 
 * @param config Request configuration
 * @returns Promise resolving to normalized HTTP response
 * @throws WciHttpError for HTTP errors, network issues, or adapter failures
 */
export const dispatchRequest = async <T = any>(
  config: WciHttpConfig,
): Promise<HttpResponse<T>> => {
  // Step 1: Full deep config merge - already done in WciHttp.request

  // Step 1.5: Placeholder for transformRequest (DO NOT implement fully)
  // if (config.transformRequest) { ... }

  // Step 2: Build final URL with query parameters
  const finalUrl = buildURL(
    config.url || '',
    config.params,
    config.paramsSerializer,
    config.baseURL
  );

  // Step 3: Determine method
  const method = (config.method || HTTP_METHODS.GET).toUpperCase();

  // Step 4: Prepare mutable request data and headers for transformRequest
  const normalizeHeaders = (
    headers?: Headers | Record<string, string>,
  ): Record<string, string> => {
    if (!headers) return {};
    if (headers instanceof Headers) {
      const normalized: Record<string, string> = {};
      headers.forEach((value, key) => {
        normalized[key] = value;
      });
      return normalized;
    }
    return { ...headers };
  };

  const mergeHeadersCaseInsensitive = (
    base: Record<string, string>,
    extra: Record<string, string>,
  ): Record<string, string> => {
    const merged = { ...base };
    for (const [key, value] of Object.entries(extra || {})) {
      const existingKey = Object.keys(merged).find(
        (k) => k.toLowerCase() === key.toLowerCase(),
      );
      if (existingKey) {
        delete merged[existingKey];
      }
      merged[key] = value;
    }
    return merged;
  };

  let requestBody: unknown = config.body;
  let requestHeaders: Record<string, string> = normalizeHeaders(config.headers);

  if (
    (method === 'POST' || method === 'PUT' || method === 'PATCH') &&
    config.data !== undefined &&
    config.body === undefined
  ) {
    requestBody = config.data;
  }

  // Step 4.5: Apply transformRequest if provided (supports single or array)
  if (config.transformRequest) {
    const transformers = Array.isArray(config.transformRequest)
      ? config.transformRequest
      : [config.transformRequest];

    for (const transformer of transformers) {
      const result = transformer.length >= 2
        ? transformer(requestBody, requestHeaders)
        : transformer(requestBody);
      requestBody = await Promise.resolve(result);
    }
  }

  // Step 4.6: Serialize request body
  const serialized = serializeRequestBody({ body: requestBody, headers: requestHeaders, responseType: config.responseType } as any);
  requestBody = serialized.body;
  requestHeaders = mergeHeadersCaseInsensitive(
    requestHeaders,
    normalizeHeaders(serialized.headers),
  );
  // Ensure canonical lower-case content-type alongside existing casing for tests and servers
  const ctKey = Object.keys(requestHeaders).find(k => k.toLowerCase() === 'content-type');
  if (ctKey) {
    const ctVal = requestHeaders[ctKey];
    if (!requestHeaders['content-type']) requestHeaders['content-type'] = ctVal;
    if (!requestHeaders['Content-Type']) requestHeaders['Content-Type'] = ctVal;
  }

  // Preserve transformResponse for post-adapter processing; avoid double-apply inside adapter
  const transformResponseConfig = config.transformResponse;

  // Step 5: Timeout/cancellation orchestration
  const { signal: timeoutSignal, clear: clearTimeout } = createTimeoutController(
    config.timeoutMs,
    config.signal
  );

  // Final AdapterConfig ready for the adapter
  const adapterConfig: AdapterConfig = {
    ...config, // Original config contains all merged properties
    url: finalUrl,
    method: method,
    headers: requestHeaders,
    body: requestBody,
    signal: timeoutSignal, // Pass the orchestrated signal
    transformResponse: undefined, // prevent adapter from applying transforms; handled in core
  };

  // Step 6: Select adapter (default or explicit override)
  const adapter: HttpAdapter = defaultAdapterResolver(adapterConfig);

  // Step 7: Execute request via adapter
  let adapterResponse: AdapterResponse<T>;
  try {
    adapterResponse = await adapter(adapterConfig);
  } catch (error) {
    clearTimeout(); // Ensure timeout is cleared even on adapter errors
    // Normalize errors immediately after adapter execution
    if (error instanceof WciHttpError) {
      throw error;
    }
    let errorCode: string;
    let errorMessage: string;
    let isTimeout = false;

    if ((error as any)?.name === 'AbortError') {
      if (config.signal?.aborted === true) { // Check original signal for user abort
        errorCode = httpErrorCodes.ABORTED;
        errorMessage = 'Request aborted by user';
      } else { // Otherwise it's a timeout
        errorCode = httpErrorCodes.TIMEOUT;
        errorMessage = 'Request timed out';
        isTimeout = true;
      }
    } else if ((error as any)?.name === 'TimeoutError') { // Specific TimeoutError from createTimeoutController
      errorCode = httpErrorCodes.TIMEOUT;
      errorMessage = 'Request timed out';
      isTimeout = true;
    } else {
      errorCode = httpErrorCodes.NETWORK_ERROR;
      errorMessage = 'Network request failed';
    }

    throw new WciHttpError({
      code: errorCode,
      message: errorMessage,
      cause: error,
      url: adapterConfig.url,
      method: adapterConfig.method,
      timeout: isTimeout,
      config: adapterConfig,
      request: adapterResponse?.request, // May not be available if adapter failed early
      response: adapterResponse as any, // May not be available
    });
  } finally {
    clearTimeout(); // Always clear timeout
  }


  // Step 8: Validate response status
  const isValidStatus =
    config.validateStatus?.(adapterResponse.status) ?? // Use original config's validateStatus
    (adapterResponse.status >= 200 && adapterResponse.status < 300);

  if (!isValidStatus) {
    let errorCode: string;
    switch (adapterResponse.status) {
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
        errorCode = `WCI_HTTP_HTTP_${adapterResponse.status}`;
        break;
    }

    throw new WciHttpError({
      code: errorCode,
      status: adapterResponse.status,
      message: `Request failed with status ${adapterResponse.status}`,
      url: adapterConfig.url,
      method: adapterConfig.method,
      config: adapterConfig,
      request: adapterResponse.request,
      response: adapterResponse as any,
    });
  }

  // Step 9: Parse response body
  let responseData = adapterResponse.data;

  // Normalize JSON string payloads (in case adapter returned raw text)
  if (
    responseData !== undefined &&
    typeof responseData === 'string' &&
    adapterResponse.headers &&
    adapterResponse.headers['content-type']?.includes('application/json') &&
    config.responseType !== 'text'
  ) {
    try {
      responseData = JSON.parse(responseData);
    } catch {
      // Leave as-is; parseResponseBody should normally handle this
    }
  }

  // Step 10: Apply transformResponse
  if (transformResponseConfig && responseData !== undefined) {
    const transformers = Array.isArray(transformResponseConfig)
      ? transformResponseConfig
      : [config.transformResponse];
    for (const transformer of transformers) {
      responseData = await Promise.resolve(
        transformer(responseData, adapterResponse.headers, adapterResponse.status)
      );
    }
  }

  // Step 11: Return standardized response
  return {
    data: responseData,
    status: adapterResponse.status,
    statusText: adapterResponse.statusText,
    headers: adapterResponse.headers,
    config: adapterConfig,
    request: adapterResponse.request,
  };
};
