/**
 * Default HTTP adapter using fetch API.
 * 
 * This adapter encapsulates the existing transport logic from dispatchRequest
 * and provides a clean separation between orchestration and execution.
 */

import { WciHttpError } from '../errors/WciHttpError';
import { createHttpErrorCodes, HttpErrorCodes } from '../errors/httpErrorCodes';
import { executeFetch } from '../requests/executeFetch'; // executeFetch uses built-in AbortController support
import { parseResponseBody } from '../utils/parseResponseBody';
import { HttpAdapter, AdapterConfig, AdapterResponse } from '../types/adapter.types';

const httpErrorCodes: HttpErrorCodes = createHttpErrorCodes();

/**
 * Default fetch-based adapter implementation.
 */
export const defaultAdapter: HttpAdapter = async <T = any>(
  config: AdapterConfig
): Promise<AdapterResponse<T>> => {
  const { fetcher = fetch, signal, url, method, headers, body, responseType } = config;

  try {
    // Execute request using existing transport logic
    const response = await executeFetch(
      fetcher,
      {
        url: url,
        method: method,
        headers: headers,
        signal: signal, // Adapter just respects the signal
        responseType: responseType,
        // Other config properties are passed along but may not be directly used by executeFetch
      },
      body
    );

    // Normalize response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Parse response body using shared parser
    let responseData: T;
    if (method === 'HEAD' || response.status === 204 || response.headers.get('content-length') === '0') {
      responseData = undefined as T;
    } else {
      responseData = (await parseResponseBody(response as any, config)) as T;
    }

    // Apply transformResponse when adapter is used directly (bypassing dispatchRequest)
    if (config.transformResponse && responseData !== undefined) {
      const transformers = Array.isArray(config.transformResponse)
        ? config.transformResponse
        : [config.transformResponse];
      for (const transformer of transformers) {
        responseData = await Promise.resolve(
          transformer(responseData, responseHeaders, response.status)
        ) as T;
      }
    }

    return {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      config: config, // AdapterConfig itself
      request: {
        url: config.url,
        method: config.method,
        headers: config.headers,
      },
    };
  } catch (error) {
    // Normalize errors to maintain existing error semantics
    if (error instanceof WciHttpError) {
      throw error;
    }

    let errorCode: string;
    let errorMessage: string;
    let isTimeout = false;

    if ((error as any)?.name === 'AbortError') {
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

    throw new WciHttpError({
      code: errorCode,
      message: errorMessage,
      cause: error,
      url: config.url,
      method: config.method,
      timeout: isTimeout,
      config: config,
    });
  }
};
