import { ParamsSerializer, ParamsSerializerOptions } from '../types/http.types';

/**
 * Default parameter serializer following Axios semantics.
 * 
 * Handles:
 * - Primitive values (string, number, boolean)
 * - Arrays with configurable formatting
 * - Nested objects (flattened with dot notation)
 * - URL encoding of special characters
 */
export function defaultParamsSerializer(
  params: Record<string, any>,
  options: ParamsSerializerOptions = {}
): string {
  const {
    encode = true,
    encodeValuesOnly = false,
    arrayFormat = 'brackets',
    indexes = null
  } = options;

  const parts: string[] = [];

  function convertKey(key: string): string {
    return encode && !encodeValuesOnly ? key : key;
  }

  function convertValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    const strValue = String(value);
    return encode ? encodeURIComponent(strValue) : strValue;
  }

  function append(key: string, value: any): void {
    if (value === null || value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      if (arrayFormat === 'none') {
        value.forEach((item) => append(key, item));
      } else if (arrayFormat === 'indices') {
        value.forEach((item, index) => {
          const indexKey = indexes !== false ? `${key}[${index}]` : `${key}[]`;
          append(indexKey, item);
        });
      } else if (arrayFormat === 'brackets') {
        value.forEach((item) => append(`${key}[]`, item));
      } else if (arrayFormat === 'repeat') {
        value.forEach((item) => append(key, item));
      } else if (arrayFormat === 'comma') {
        append(key, value.join(','));
      }
    } else if (typeof value === 'object') {
      Object.keys(value).forEach((subKey) => {
        append(`${key}.${subKey}`, value[subKey]);
      });
    } else {
      parts.push(`${convertKey(key)}=${convertValue(value)}`);
    }
  }

  Object.keys(params).forEach((key) => {
    append(key, params[key]);
  });

  return parts.join('&');
}

/**
 * Create a parameter serializer function with custom options.
 */
export function createParamsSerializer(options: ParamsSerializerOptions): ParamsSerializer {
  return (params: Record<string, any>) => defaultParamsSerializer(params, options);
}
