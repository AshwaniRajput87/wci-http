import {
  WciHttpConfig,
  HttpRequest,
  RequestInterceptor,
  ResponseInterceptor,
} from '../types/http.types'
import { coreHttpClient } from './core'
import { deepMerge } from '../utils/mergeConfig'
import { DEFAULT_WCI_HTTP_CONFIG } from './httpConfig'
import { InterceptorManager } from '../interceptors/interceptorManager'
import { HTTP_METHODS } from '../constants/httpMethods'

export class WciHttp {
  public config: WciHttpConfig
  public interceptors: {
    request: InterceptorManager<RequestInterceptor>
    response: InterceptorManager<ResponseInterceptor>
  }

  constructor(config?: WciHttpConfig) {
    this.config = deepMerge(DEFAULT_WCI_HTTP_CONFIG, config)
    this.interceptors = {
      request: new InterceptorManager<RequestInterceptor>(),
      response: new InterceptorManager<ResponseInterceptor>(),
    }
  }

  public static create(config?: WciHttpConfig): WciHttp {
    return new WciHttp(config)
  }

  public create(config?: WciHttpConfig): WciHttp {
    return new WciHttp(deepMerge(this.config, config))
  }

  public async request<T = unknown>(requestConfig: WciHttpConfig): Promise<T> {
    const finalConfig = deepMerge(this.config, requestConfig) as HttpRequest

    const requestInterceptors: RequestInterceptor[] = []
    this.interceptors.request.forEach((interceptor) => {
      requestInterceptors.push(interceptor.fulfilled)
    })
    if (requestConfig.requestInterceptors) {
      requestInterceptors.push(...requestConfig.requestInterceptors)
    }
    finalConfig.requestInterceptors = requestInterceptors

    const responseInterceptors: ResponseInterceptor[] = []
    this.interceptors.response.forEach((interceptor) => {
      responseInterceptors.push(interceptor.fulfilled)
    })
    if (requestConfig.responseInterceptors) {
      responseInterceptors.push(...requestConfig.responseInterceptors)
    }
    finalConfig.responseInterceptors = responseInterceptors

    return coreHttpClient<T>(finalConfig)
  }

  public get<T = unknown>(url: string, config: WciHttpConfig = {}): Promise<T> {
    return this.request<T>({ ...config, method: HTTP_METHODS.GET, url })
  }

  public post<T = unknown>(
    url: string,
    data?: any,
    config: WciHttpConfig = {}
  ): Promise<T> {
    return this.request<T>({ ...config, method: HTTP_METHODS.POST, url, data })
  }

  public put<T = unknown>(
    url: string,
    data?: any,
    config: WciHttpConfig = {}
  ): Promise<T> {
    return this.request<T>({ ...config, method: HTTP_METHODS.PUT, url, data })
  }

  public patch<T = unknown>(
    url: string,
    data?: any,
    config: WciHttpConfig = {}
  ): Promise<T> {
    return this.request<T>({ ...config, method: HTTP_METHODS.PATCH, url, data })
  }

  public delete<T = unknown>(
    url: string,
    config: WciHttpConfig = {}
  ): Promise<T> {
    return this.request<T>({ ...config, method: HTTP_METHODS.DELETE, url })
  }

  public head<T = unknown>(
    url: string,
    config: WciHttpConfig = {}
  ): Promise<T> {
    return this.request<T>({ ...config, method: HTTP_METHODS.HEAD, url })
  }

  public options<T = unknown>(
    url: string,
    config: WciHttpConfig = {}
  ): Promise<T> {
    return this.request<T>({ ...config, method: HTTP_METHODS.OPTIONS, url })
  }
}
