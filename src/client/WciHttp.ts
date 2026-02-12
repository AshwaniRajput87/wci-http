import {
  WciHttpConfig,
  HttpResponse,
  HttpLogEventType,
} from '../types/http.types';
import { dispatchRequest } from './dispatchRequest';
import { mergeWciConfig } from '../utils/mergeConfig';
import { DEFAULT_WCI_HTTP_CONFIG } from './httpConfig';
import { Interceptor, InterceptorManager } from '../interceptors/interceptorManager';
import { HTTP_METHODS } from '../constants/httpMethods';
import { WciHttpError } from '../errors/WciHttpError';
import { isNetworkError } from '../errors/parseError';
import { sleep } from '../utils/sleepUtils';
import { createHttpErrorCodes } from '../errors/httpErrorCodes';
import { LogLevel } from '../types/loggingTypes';

const RETRY_EVENT_CATEGORY = 'WciHttp.Retry';
const httpErrorCodes = createHttpErrorCodes();

/**
 * Calculates the delay before the next retry based on the backoff strategy.
 * @param attemptNumber One-based attempt count (1 = first attempt).
 * @param delay Base delay in milliseconds.
 * @param backoff Backoff strategy.
 */
const calculateDelay = (
  attemptNumber: number,
  delay: number,
  backoff: 'fixed' | 'exponential',
): number => {
  if (backoff === 'exponential') {
    return delay * Math.pow(2, Math.max(0, attemptNumber - 1));
  }
  return delay;
};

/**
 * Determines if an error is retryable based on the retry configuration.
 * @param error The WciHttpError that occurred.
 * @param retryConfig The retry configuration from WciHttpConfig.
 * @returns True if the error is retryable, false otherwise.
 */
const shouldRetry = (error: WciHttpError, retryConfig?: WciHttpConfig['retry']): boolean => {
  if (!retryConfig) return false;

  // Never retry aborted or explicitly non-retryable errors
  if (error.code === httpErrorCodes.ABORTED || error.retryable === false) {
    return false;
  }

  // Network errors if allowed
  if (retryConfig.retryOnNetworkError && isNetworkError(error)) {
    return true;
  }

  // HTTP status based retry
  if (typeof error.status === 'number') {
    return retryConfig.retryOn.includes(error.status);
  }

  return false;
};

const attachAbortListener = (
  signal: AbortSignal,
  callback: () => void,
): () => void => {
  if (typeof signal.addEventListener === 'function') {
    signal.addEventListener('abort', callback, { once: true });
    return () => signal.removeEventListener('abort', callback);
  }

  const previousOnAbort = signal.onabort;
  signal.onabort = ((event?: Event) => {
    callback();
    if (typeof previousOnAbort === 'function') {
      previousOnAbort.call(signal, event);
    }
  }) as ((this: AbortSignal, event?: Event) => any);

  return () => {
    signal.onabort = previousOnAbort;
  };
};

const createAbortError = (
  config: WciHttpConfig,
  attemptsMade: number,
  maxRetries: number,
  cause?: unknown,
): WciHttpError =>
  new WciHttpError({
    code: httpErrorCodes.ABORTED,
    message: 'Request aborted',
    config,
    cause,
    retry: {
      attempted: attemptsMade,
      maxRetries,
      exhausted: false,
    },
  });

const waitForRetryDelay = async (
  delayMs: number,
  signal: AbortSignal | undefined,
  onAbort: () => void,
): Promise<void> => {
  if (!signal) {
    await sleep(delayMs);
    return;
  }

  if (signal.aborted) {
    onAbort();
    return;
  }

  let removeAbortListener = () => {};
  const abortPromise = new Promise<void>((_, reject) => {
    removeAbortListener = attachAbortListener(signal, () => {
      reject(new Error('aborted'));
    });
  });

  try {
    await Promise.race([
      sleep(delayMs),
      abortPromise,
    ]);
  } finally {
    removeAbortListener();
  }
};

/**
 * Executes a request with retry logic.
 * This function encapsulates the core retry loop, including applying interceptors,
 * dispatching the request, handling errors, and managing retry attempts and delays.
 *
 * @param initialConfig The initial merged configuration for the request.
 * @param requestInterceptors The list of request interceptor handlers.
 * @param responseInterceptors The list of response interceptor handlers.
 * @returns A promise that resolves with the HttpResponse or rejects with a WciHttpError.
 */
async function executeWithRetry<T = any>(
  config: WciHttpConfig,
  adapterExecutor: (config: WciHttpConfig) => Promise<HttpResponse<T>>,
): Promise<HttpResponse<T>> {
  const retryConfig = config.retry;
  const maxRetries = retryConfig?.retries ?? 0;
  const totalAttempts = maxRetries + 1;
  const loggingLevel = config.logging?.level ?? LogLevel.NONE;
  const logger = config.logger;

  for (let attemptIndex = 0; attemptIndex < totalAttempts; attemptIndex++) {
    const attemptNumber = attemptIndex + 1;

    // Abort safety before executing attempt
    if (config.signal?.aborted) {
      throw createAbortError(config, attemptNumber - 1, maxRetries);
    }

    try {
      // Shallow clone to avoid mutating the base config across attempts
      const attemptConfig = { ...config } as WciHttpConfig;
      return await adapterExecutor(attemptConfig);
    } catch (err) {
      if (!(err instanceof WciHttpError)) {
        throw err;
      }

      const retryable = shouldRetry(err, retryConfig);
      const exhausted = !retryable ? false : attemptNumber > maxRetries;

      err.retry = {
        attempted: attemptNumber,
        maxRetries,
        exhausted,
      };

      // Abort errors short-circuit immediately
      if (err.code === httpErrorCodes.ABORTED || config.signal?.aborted) {
        throw err;
      }

      if (exhausted || !retryable) {
        if (loggingLevel !== LogLevel.NONE) {
          const message = `Request failed after ${attemptNumber} attempts. Retry metadata: ${JSON.stringify(err.retry)}`;
          if (logger) {
            logger.error({
              type: HttpLogEventType.REQUEST_ERROR,
              level: 'error',
              category: RETRY_EVENT_CATEGORY,
              message,
              url: config.url,
              method: config.method,
              attempt: attemptNumber,
              maxAttempts: maxRetries,
              error: err,
              retry: err.retry,
            });
          } else {
            console.error(message);
          }
        }
        throw err;
      }

      // Prepare next retry
      const delayMs = calculateDelay(attemptNumber, retryConfig!.delay, retryConfig!.backoff);

      if (loggingLevel !== LogLevel.NONE) {
        const reason = typeof err.status === 'number' ? `status ${err.status}` : 'network error';
        const message = `Attempt ${attemptNumber} failed with ${reason}. Retrying in ${delayMs}ms...`;
        if (logger) {
          logger.info({
            type: HttpLogEventType.RETRY,
            level: 'info',
            category: RETRY_EVENT_CATEGORY,
            message,
            url: config.url,
            method: config.method,
            attempt: attemptNumber,
            maxAttempts: maxRetries,
            delay: delayMs,
            error: err,
          });
        } else {
          console.log(message);
        }
      }

      try {
        await waitForRetryDelay(delayMs, config.signal, () => {
          throw createAbortError(config, attemptNumber, maxRetries, err);
        });
      } catch (abortReason: any) {
        const abortError = abortReason instanceof WciHttpError
          ? abortReason
          : createAbortError(config, attemptNumber, maxRetries, abortReason);
        abortError.retry = {
          attempted: attemptNumber,
          maxRetries,
          exhausted: false,
        };
        throw abortError;
      }
    }
  }

  throw new WciHttpError({
    code: httpErrorCodes.UNKNOWN_ERROR,
    message: 'Unexpected retry termination',
    config,
  });
}

export class WciHttp {
  public config: WciHttpConfig;
  public methodDefaults: Record<string, Partial<WciHttpConfig>>;
  public interceptors: {
    request: InterceptorManager<WciHttpConfig>;
    response: InterceptorManager<HttpResponse>;
  };

  constructor(instanceConfig?: WciHttpConfig) {
    // Add environment variable support
    const envConfig: Partial<WciHttpConfig> = {};
    if (typeof process !== 'undefined' && process.env?.WCI_HTTP_BASE_URL) {
      envConfig.baseURL = process.env.WCI_HTTP_BASE_URL;
    }

    const configsToMerge: Array<Partial<WciHttpConfig>> = [
      DEFAULT_WCI_HTTP_CONFIG,
      envConfig
    ];

    this.methodDefaults = {};
    const nonMethodSpecificInstanceConfig: Partial<WciHttpConfig> = {};

    if (instanceConfig) {
      Object.entries(instanceConfig).forEach(([key, value]) => {
        const lowerKey = key.toLowerCase();
        if (Object.values(HTTP_METHODS).map(m => m.toLowerCase()).includes(lowerKey)) {
          this.methodDefaults[lowerKey] = value as Partial<WciHttpConfig>;
        } else {
          (nonMethodSpecificInstanceConfig as any)[key] = value;
        }
      });
      configsToMerge.push(nonMethodSpecificInstanceConfig);
    }
    
    this.config = mergeWciConfig(...configsToMerge);

    this.interceptors = {
      request: new InterceptorManager<WciHttpConfig>(),
      response: new InterceptorManager<HttpResponse>(),
    };
  }

  public static create(config?: WciHttpConfig): WciHttp {
    return new WciHttp(config);
  }

  public create(config?: WciHttpConfig): WciHttp {
    return new WciHttp(mergeWciConfig(this.config, config));
  }

  public async request<T = any>(requestConfig: WciHttpConfig): Promise<HttpResponse<T>> {
    const requestMethod = (requestConfig.method || this.config.method || HTTP_METHODS.GET).toLowerCase();
    const methodSpecificConfig = this.methodDefaults[requestMethod] || {};

    const mergedConfig = mergeWciConfig(this.config, methodSpecificConfig, requestConfig);

    if (mergedConfig.method) {
      mergedConfig.method = mergedConfig.method.toUpperCase() as any;
    }

    const requestInterceptors: (Interceptor<WciHttpConfig> | null)[] = [
      ...(mergedConfig.requestInterceptors ?? []),
      ...this.interceptors.request.getHandlers(),
    ];

    const responseInterceptors: (Interceptor<HttpResponse<T>> | null)[] = [
      ...this.interceptors.response.getHandlers(),
      ...(mergedConfig.responseInterceptors ?? []),
    ];

    const adapterExecutor = async (attemptConfig: WciHttpConfig): Promise<HttpResponse<T>> => {
      // apply request interceptors
      let processedConfig = attemptConfig;
      for (const interceptor of requestInterceptors) {
        if (!interceptor || !interceptor.fulfilled) continue;
        if (interceptor.runWhen && !interceptor.runWhen(processedConfig)) continue;
        processedConfig = await Promise.resolve(interceptor.fulfilled(processedConfig));
      }

      // execute adapter
      let response = await dispatchRequest(processedConfig);

      // apply response interceptors
      for (const interceptor of responseInterceptors) {
        if (!interceptor || !interceptor.fulfilled) continue;
        if (interceptor.runWhen && !interceptor.runWhen(processedConfig)) continue;
        response = await Promise.resolve(interceptor.fulfilled(response));
      }

      return response;
    };

    return executeWithRetry<T>(mergedConfig, adapterExecutor);
  }

  public get<T = any>(
    url: string,
    config: WciHttpConfig = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: HTTP_METHODS.GET, url });
  }

  public post<T = any>(
    url: string,
    data?: any,
    config: WciHttpConfig = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: HTTP_METHODS.POST, url, data });
  }

  public put<T = any>(
    url: string,
    data?: any,
    config: WciHttpConfig = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: HTTP_METHODS.PUT, url, data });
  }

  public patch<T = any>(
    url: string,
    data?: any,
    config: WciHttpConfig = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: HTTP_METHODS.PATCH, url, data });
  }

  public delete<T = any>(
    url: string,
    config: WciHttpConfig = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: HTTP_METHODS.DELETE, url });
  }

  public head<T = any>(
    url: string,
    config: WciHttpConfig = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: HTTP_METHODS.HEAD, url });
  }

  public options<T = any>(
    url: string,
    config: WciHttpConfig = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: HTTP_METHODS.OPTIONS, url });
  }
}
