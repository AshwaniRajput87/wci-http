import {
  WciHttpConfig,
  HttpResponse,
  RequestInterceptor,
  ResponseInterceptor,
} from '../types/http.types';
import { dispatchRequest } from './dispatchRequest';
import { deepMerge } from '../utils/mergeConfig';
import { DEFAULT_WCI_HTTP_CONFIG } from './httpConfig';
import { InterceptorManager } from '../interceptors/interceptorManager';
import { HTTP_METHODS } from '../constants/httpMethods';

export class WciHttp {
  public config: WciHttpConfig;
  public interceptors: {
    request: InterceptorManager<WciHttpConfig>;
    response: InterceptorManager<HttpResponse>;
  };

  constructor(config?: WciHttpConfig) {
    this.config = deepMerge(DEFAULT_WCI_HTTP_CONFIG, config);
    this.interceptors = {
      request: new InterceptorManager<WciHttpConfig>(),
      response: new InterceptorManager<HttpResponse>(),
    };
  }

  public static create(config?: WciHttpConfig): WciHttp {
    return new WciHttp(config);
  }

  public create(config?: WciHttpConfig): WciHttp {
    return new WciHttp(deepMerge(this.config, config));
  }

  public request<T = any>(
    requestConfig: WciHttpConfig,
  ): Promise<HttpResponse<T>> {
    const mergedConfig = deepMerge(this.config, requestConfig);

    const chain: any[] = [dispatchRequest, undefined];

    try {
      this.interceptors.request.getHandlers().forEach((interceptor) => {
        if (interceptor) {
          const run =
            !interceptor.runWhen || interceptor.runWhen(mergedConfig);
          chain.unshift(
            run ? interceptor.fulfilled : undefined,
            run ? interceptor.rejected : undefined,
          );
        }
      });

      this.interceptors.response.getHandlers().forEach((interceptor) => {
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

    let promise = Promise.resolve(mergedConfig);

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
