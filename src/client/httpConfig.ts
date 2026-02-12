import { WciHttpConfig } from '../types';

export const DEFAULT_WCI_HTTP_CONFIG: WciHttpConfig = {
    responseType: 'json',
    headers: {},
    timeout: 0, // 0 means no timeout
    method: 'get',
    retry: {
        retries: 0,
        delay: 1000,
        backoff: "fixed",
        retryOn: [500, 502, 503, 504],
        retryOnNetworkError: true,
    },
    logging: {
        level: 'none',
        logRequestHeaders: false,
        logResponseHeaders: false,
    },
    requestInterceptors: [],
    responseInterceptors: [],
    validateStatus: (status: number) => status >= 200 && status < 300,
};
