import { WciHttpConfig } from '../types';

export const DEFAULT_WCI_HTTP_CONFIG: WciHttpConfig = {
    responseType: 'json',
    headers: {},
    timeout: 0, // 0 means no timeout
    method: 'get',
    retry: {
        attempts: 0, // No retries by default
        delay: 1000, // 1 second delay
    },
    logging: {
        level: 'none',
        logRequestHeaders: false,
        logResponseHeaders: false,
    },
    interceptors: [],
    validateStatus: (status: number) => status >= 200 && status < 300,
};
