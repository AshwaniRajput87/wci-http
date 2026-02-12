import { HTTP_METHODS } from '../constants/httpMethods';
import { WciHttpConfig } from '../types/http.types';

const isPlainObject = (val: any): val is Record<string, any> => {
  if (val === null || typeof val !== 'object' || Array.isArray(val)) return false;

  // Treat built-in body types as non-plain to avoid cloning/stripping behavior (e.g., FormData)
  const tag = (val as any)[Symbol.toStringTag];
  if (tag === 'FormData' || tag === 'URLSearchParams') return false;
  if (val instanceof Blob || val instanceof ArrayBuffer) return false;
  // Some environments expose ReadableStream; exclude to keep streaming bodies intact
  if (typeof ReadableStream !== 'undefined' && val instanceof ReadableStream) return false;
  if (typeof (val as any).append === 'function') return false; // catch FormData-like without tags
  if (typeof (val as any).pipe === 'function') return false; // streams should not be deep merged

  return true;
};

const toArray = <T>(val: T | T[] | undefined): T[] => {
  if (val === undefined) return [];
  return Array.isArray(val) ? val : [val];
};

const setHeader = (target: Record<string, any>, key: string, value: any) => {
  const existingKey = Object.keys(target).find(
    (k) => k.toLowerCase() === key.toLowerCase(),
  );

  if (value === undefined) {
    return;
  }

  const finalKey = existingKey ?? key;
  target[finalKey] = value;
};

const mergeHeaders = (base: any, source: any): Record<string, any> => {
  const result: Record<string, any> = { ...(base || {}) };
  if (!isPlainObject(source)) return result;

  Object.entries(source).forEach(([key, value]) => {
    if (value === undefined) return;
    if (value === null) {
      setHeader(result, key, null);
      return;
    }

    if (isPlainObject(result[key]) && isPlainObject(value)) {
      result[key] = mergeHeaders(result[key], value);
      return;
    }

    setHeader(result, key, value);
  });

  return result;
};

const mergeDeep = (base: any, source: any): any => {
  if (!isPlainObject(source)) return base;
  const result = { ...(isPlainObject(base) ? base : {}) } as Record<string, any>;

  Object.entries(source).forEach(([key, value]) => {
    if (value === undefined) return; // ignore undefined

    if (value === null) {
      result[key] = null; // explicit wipe
      return;
    }

    if (Array.isArray(value)) {
      result[key] = value.slice(); // overwrite arrays by default
      return;
    }

    if (isPlainObject(value)) {
      result[key] = mergeDeep(result[key], value);
      return;
    }

    result[key] = value; // scalar overwrite
  });

  return result;
};

const concatArrays = (base: any, source: any) => {
  const baseArr = toArray(base);
  const sourceArr = toArray(source);
  return [...baseArr, ...sourceArr];
};

const METHOD_HEADER_KEYS = Object.values(HTTP_METHODS).map((m) => m.toLowerCase());

const flattenHeaders = (headers: any, method?: string) => {
  if (!isPlainObject(headers)) return {};

  const flat: Record<string, any> = {};
  const methodKey = (method || 'get').toLowerCase();

  const layers = [headers.common, headers[methodKey], headers];

  layers.forEach((layer, idx) => {
    if (!isPlainObject(layer)) return;
    Object.entries(layer).forEach(([key, value]) => {
      const lower = key.toLowerCase();
      const isScopedKey = METHOD_HEADER_KEYS.includes(lower) || lower === 'common';
      if (idx === 2 && isScopedKey) return; // skip scoped holders on final layer
      setHeader(flat, key, value);
    });
  });

  return flat;
};

const normalizeRetry = (base: any, source: any) => {
  const baseObj = isPlainObject(base) ? base : undefined;

  if (source === undefined) return baseObj;
  if (source === null) return null;
  if (typeof source === 'boolean') {
    return source ? baseObj : undefined;
  }

  if (isPlainObject(source)) {
    return {
      ...(baseObj ?? {}),
      ...source,
    };
  }

  return baseObj;
};

const normalizeLogging = (base: any, source: any) => {
  const defaultLogging = {
    level: 'none',
    logRequestHeaders: false,
    logResponseHeaders: false,
  };

  if (source === undefined) return base ?? defaultLogging;
  if (source === null) return null;

  if (typeof source === 'boolean') {
    return source ? defaultLogging : null;
  }

  if (isPlainObject(source)) {
    return mergeDeep(defaultLogging, mergeDeep(base, source));
  }

  return base ?? defaultLogging;
};

/**
 * Authoritative Axios-like configuration merge for WciHttp.
 */
export const mergeWciConfig = (
  ...configs: Array<Partial<WciHttpConfig> & Record<string, any>>
): WciHttpConfig => {
  let result: Record<string, any> = {};

  configs.forEach((config) => {
    if (!isPlainObject(config)) return;

    Object.entries(config).forEach(([key, value]) => {
      if (value === undefined) return; // ignore undefined

      switch (key) {
        case 'headers':
          result.headers = mergeHeaders(result.headers, value);
          break;
        case 'timeout':
          result.timeout = value;
          if (value === null) {
            result.timeoutMs = null as any;
          } else if (typeof value === 'number') {
            result.timeoutMs = value;
          }
          break;
        case 'timeoutMs':
          result.timeoutMs = value;
          break;
        case 'transformRequest':
        case 'transformResponse':
        case 'requestInterceptors':
        case 'responseInterceptors':
          result[key] = concatArrays(result[key], value);
          break;
        case 'retry':
          result.retry = normalizeRetry(result.retry, value);
          break;
        case 'logging':
          result.logging = normalizeLogging(result.logging, value);
          break;
        case 'withCredentials':
          result.withCredentials = value;
          break;
        case 'signal':
          result.signal = value;
          break;
        case 'params':
        case 'query':
          result[key] = mergeDeep(result[key], value);
          break;
        default:
          if (value === null) {
            result[key] = null;
          } else if (isPlainObject(value)) {
            result[key] = mergeDeep(result[key], value);
          } else if (Array.isArray(value)) {
            // Overwrite non-special arrays
            result[key] = value.slice();
          } else {
            result[key] = value;
          }
      }
    });
  });

  // Normalize timeout → timeoutMs when only timeout provided
  if (result.timeoutMs === undefined && typeof result.timeout === 'number') {
    result.timeoutMs = result.timeout;
  }

  // Flatten headers to axios-style output
  if (result.headers) {
    result.headers = flattenHeaders(result.headers, result.method as string | undefined);
  }

  return result as WciHttpConfig;
};

// Exported for compatibility with legacy imports; retains recursive object merge semantics.
export const deepMerge = mergeDeep;
