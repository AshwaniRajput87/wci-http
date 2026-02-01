import { WciHttpConfig } from '../types';
import { httpClient } from './httpClient';
import { getBaseUrlFromEnv } from '../utils/getBaseUrlFromEnv';
import { deepMerge } from '../utils/mergeConfig';
import { flattenHeaders } from '../utils/mergeHeadersUtils';
import { DEFAULT_WCI_HTTP_CONFIG } from './httpConfig';

export class WciHttp {
    private config: WciHttpConfig;

    constructor(config: WciHttpConfig = {}) {
        // Deep merge global defaults with instance-specific config
        this.config = deepMerge(DEFAULT_WCI_HTTP_CONFIG, config);

        // Retain custom baseURL logic
        this.config.baseURL = config.baseURL ?? getBaseUrlFromEnv();
    }

    /**
     * Creates a new WciHttp instance with inherited and merged configuration.
     * @param config The configuration to merge with the current instance's config.
     * @returns A new WciHttp instance.
     */
    public create(config: WciHttpConfig): WciHttp {
        return new WciHttp(deepMerge(this.config, config));
    }

    /**
     * The central request method where all configuration is merged and processed.
     * @param requestConfig The request-specific configuration.
     * @returns A promise that resolves with the response data.
     */
    public async request<T = unknown>(requestConfig: WciHttpConfig): Promise<T> {
        // 1. Deep merge instance config with the request-specific config
        const finalConfig = deepMerge(this.config, requestConfig);

        // 2. Flatten headers using Axios-style hierarchy (common, method, request)
        finalConfig.headers = flattenHeaders(finalConfig);

        // 3. Execute the request with the final, processed configuration
        return httpClient<T>(finalConfig);
    }

    public get<T = unknown>(url: string, config: WciHttpConfig = {}): Promise<T> {
        return this.request<T>({ ...config, method: 'get', url });
    }

    public post<T = unknown>(url:string, data?: any, config: WciHttpConfig = {}): Promise<T> {
        return this.request<T>({ ...config, method: 'post', url, data });
    }

    public put<T = unknown>(url: string, data?: any, config: WciHttpConfig = {}): Promise<T> {
        return this.request<T>({ ...config, method: 'put', url, data });
    }

    public patch<T = unknown>(url: string, data?: any, config: WciHttpConfig = {}): Promise<T> {
        return this.request<T>({ ...config, method: 'patch', url, data });
    }

    public delete<T = unknown>(url: string, config: WciHttpConfig = {}): Promise<T> {
        return this.request<T>({ ...config, method: 'delete', url });
    }

    public head<T = unknown>(url: string, config: WciHttpConfig = {}): Promise<T> {
        return this.request<T>({ ...config, method: 'head', url });
    }

    public options<T = unknown>(url: string, config: WciHttpConfig = {}): Promise<T> {
        return this.request<T>({ ...config, method: 'options', url });
    }

    /**
     * Alias for the `delete` method.
     */
    public get del() {
        return this.delete;
    }
}