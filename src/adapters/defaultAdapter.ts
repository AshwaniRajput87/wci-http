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
import type { HttpRequest } from '../types/http.types';
import { createProgressStream } from '../utils/createProgressStream'; // Import the new utility
import { createDownloadProgressStream } from '../utils/createDownloadProgressStream'; // Import download utility

const httpErrorCodes: HttpErrorCodes = createHttpErrorCodes();

/**
 * Default fetch-based adapter implementation.
 */
export const defaultAdapter: HttpAdapter = async <T = any>(
  config: AdapterConfig
): Promise<AdapterResponse<T>> => {
  const { fetcher = fetch, signal, url, method, headers, body, responseType, onUploadProgress, onDownloadProgress, data } = config;

  let requestBody: BodyInit | undefined = body ?? (data as BodyInit | undefined);
  let requestHeaders = { ...headers };

  const isUserAborted = signal?.aborted === true || config.signal?.aborted === true;

  // If already aborted before sending, emit minimal progress callbacks and throw abort
  if (isUserAborted) {
    if (requestBody && onUploadProgress) {
      onUploadProgress({ loaded: 0, total: undefined, progress: 0 });
    }
    if (onDownloadProgress) {
      onDownloadProgress({ loaded: 0, total: undefined, progress: 0 });
    }
    throw new WciHttpError({
      code: httpErrorCodes.ABORTED,
      message: 'Request aborted by user',
      url,
      method,
      timeout: false,
      config,
    });
  }

  // Handle upload progress
  if (requestBody && onUploadProgress) {
    const { stream, contentLength, contentType } = await createProgressStream(requestBody, onUploadProgress);
    requestBody = stream;
    if (contentLength !== undefined) {
      requestHeaders['Content-Length'] = String(contentLength);
    }
    if (contentType !== undefined && !requestHeaders['Content-Type']) {
      requestHeaders['Content-Type'] = contentType;
    }
  }

  const isNodeRuntime = typeof process !== 'undefined' && typeof process.versions?.node === 'string';
  const hasBody = requestBody !== undefined && requestBody !== null;
  const enableDuplex =
    isNodeRuntime && hasBody && Boolean(onUploadProgress);

  const credentialsMode: RequestCredentials = config.withCredentials ? 'include' : 'same-origin';

  const fetchRequest: HttpRequest & { duplex?: 'half' } = {
    url,
    method,
    headers: requestHeaders,
    signal,
    responseType,
    credentials: credentialsMode,
    withCredentials: config.withCredentials,
  };

  if (enableDuplex) {
    fetchRequest.duplex = 'half';
  }

  try {
    // Execute request using existing transport logic
    let response = await executeFetch(
      fetcher,
      fetchRequest,
      requestBody,
      signal // ensure abort/timeout signals are passed to fetch
    );

    // Handle download progress
    if (onDownloadProgress && response.body) {
      const contentLengthHeader = response.headers.get('content-length');
      const totalDownloadSize = contentLengthHeader ? parseInt(contentLengthHeader, 10) : undefined;

      const progressTrackingStream = createDownloadProgressStream(
        response.body,
        totalDownloadSize,
        onDownloadProgress
      );

      // Create a new Response object with the progress-tracking stream
      response = new Response(progressTrackingStream, {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
      });
    }


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
      // If aborted after receiving response, surface abort before parsing
      if (signal?.aborted) {
        throw new WciHttpError({
          code: httpErrorCodes.ABORTED,
          message: 'Request aborted by user',
          url: config.url,
          method: config.method,
          timeout: false,
          config,
        });
      }
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

    const abortLike =
      (error as any)?.name === 'AbortError' ||
      (typeof (error as any)?.message === 'string' &&
        (error as any).message.toLowerCase().includes('abort'));
    const userAborted = signal?.aborted === true || config.signal?.aborted === true;

    if (abortLike) {
      if (userAborted) {
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
