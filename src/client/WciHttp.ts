import type { HttpClientConfig, HttpRequestOptions, HttpHeaders } from "../types/http.types";
import { get as getRequest } from '../requests/get';
import { post as postRequest } from '../requests/post';
import { put as putRequest } from '../requests/put';
import { patch as patchRequest } from '../requests/patch';
import { del as deleteRequest } from '../requests/delete';
import { head as headRequest } from '../requests/head';
import { optionsReq } from '../requests/options';

import { getBaseUrlFromEnv } from "../utils/getBaseUrlFromEnv";

const mergeHeaders = (instanceHeaders?: HttpHeaders, requestHeaders?: HttpHeaders): HttpHeaders => {
  return { ...instanceHeaders, ...requestHeaders };
}

export class WciHttp {
  private config: HttpClientConfig;

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      ...config,
      baseURL: config.baseURL ?? getBaseUrlFromEnv(),
    }
  }

  public create(config: HttpClientConfig): WciHttp {
    return new WciHttp({
      ...this.config,
      ...config,
      headers: mergeHeaders(this.config.headers, config.headers),
    });
  }

  public get<T = unknown>(url: string, options: HttpRequestOptions = {}): Promise<T> {
    return getRequest<T>(url, options, this.config);
  }

  public post<T = unknown>(url: string, data?: any, options: HttpRequestOptions = {}): Promise<T> {
    return postRequest<T>(url, data, options, this.config);
  }

  public put<T = unknown>(url: string, data?: any, options: HttpRequestOptions = {}): Promise<T> {
    return putRequest<T>(url, data, options, this.config);
  }

  public patch<T = unknown>(url: string, data?: any, options: HttpRequestOptions = {}): Promise<T> {
    return patchRequest<T>(url, data, options, this.config);
  }

  public delete<T = unknown>(url: string, options: HttpRequestOptions = {}): Promise<T> {
    return deleteRequest<T>(url, options, this.config);
  }

  public head<T = unknown>(url: string, options: HttpRequestOptions = {}): Promise<T> {
    return headRequest<T>(url, options, this.config);
  }

  public options<T = unknown>(url: string, options: HttpRequestOptions = {}): Promise<T> {
    return optionsReq<T>(url, options, this.config);
  }

  public get del() {
    return this.delete;
  }
}