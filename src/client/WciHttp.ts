import {
  WciHttpConfig,
  HttpResponse,
  RequestInterceptor,
  ResponseInterceptor,
} from '../types/http.types';
import { dispatchRequest } from './dispatchRequest';
import { mergeWciConfig } from '../utils/mergeConfig';
import { DEFAULT_WCI_HTTP_CONFIG } from './httpConfig';
import { InterceptorManager } from '../interceptors/interceptorManager';
import { HTTP_METHODS } from '../constants/httpMethods';

export class WciHttp {
  public config: WciHttpConfig;
  public methodDefaults: Record<string, Partial<WciHttpConfig>>;

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

  public request<T = any>(requestConfig: WciHttpConfig): Promise<HttpResponse<T>> {
    const requestMethod = (requestConfig.method || this.config.method || HTTP_METHODS.GET).toLowerCase();
    const methodSpecificConfig = this.methodDefaults[requestMethod] || {};

    const mergedConfig = mergeWciConfig(this.config, methodSpecificConfig, requestConfig);
    const requestLevelReq = mergedConfig.requestInterceptors ?? [];
    const requestLevelRes = mergedConfig.responseInterceptors ?? [];

    if (mergedConfig.method) {
      mergedConfig.method = mergedConfig.method.toUpperCase() as any;
    }

    const chain: any[] = [dispatchRequest, undefined];

    try {
      const requestInterceptors = [
        ...requestLevelReq,
        ...this.interceptors.request.getHandlers(),
      ];

      requestInterceptors.forEach((interceptor) => {
        if (interceptor) {
          const run =
            !interceptor.runWhen || interceptor.runWhen(mergedConfig);
          chain.unshift(
            run ? interceptor.fulfilled : undefined,
            run ? interceptor.rejected : undefined,
          );
        }
      });

      const responseInterceptors = [
        ...this.interceptors.response.getHandlers(),
        ...requestLevelRes,
      ];

      responseInterceptors.forEach((interceptor) => {
        if (interceptor) {
          const run =
            !interceptor.runWhen || interceptor.runWhen(mergedConfig);
          chain.push(
            run ? interceptor.fulfilled : undefined,
            run ? interceptor.rejected : undefined,
          );
        }
      });
    } catch (error) {
      return Promise.reject(error);
    }

    let promise: Promise<any> = Promise.resolve(mergedConfig);

    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift());
    }

    return promise as Promise<HttpResponse<T>>;
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
