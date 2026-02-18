import { describe, it, expect } from 'vitest';
import { buildURL } from '../../src/utils/buildURL';

describe('buildURL Utility', () => {
  it('should handle simple params correctly', () => {
    const result = buildURL('/users', { page: 1 });
    expect(result).toBe('/users?page=1');
  });

  it('should handle array params correctly', () => {
    const result = buildURL('/search', { tags: ['js', 'ts'] });
    expect(result).toBe('/search?tags[]=js&tags[]=ts');
  });

  it('should handle nested params correctly', () => {
    const result = buildURL('/filter', { filter: { a: 1 } });
    expect(result).toBe('/filter?filter.a=1');
  });

  it('should merge params with existing query string correctly', () => {
    const result = buildURL('/users?active=true', { page: 2 });
    expect(result).toBe('/users?active=true&page=2');
  });

  it('should use custom paramsSerializer correctly', () => {
    const customSerializer = (params: any) => `q=${params.q}`;
    const result = buildURL('/custom', { q: 'hello world' }, customSerializer);
    expect(result).toBe('/custom?q=hello world');
  });

  it('should handle special characters in params correctly', () => {
    const result = buildURL('/search', { query: 'hello world & more' });
    expect(result).toBe('/search?query=hello%20world%20%26%20more');
  });

  it('should handle null and undefined params correctly', () => {
    const result = buildURL('/api', { 
      valid: 'value',
      nullValue: null,
      undefinedValue: undefined,
    });
    expect(result).toBe('/api?valid=value');
  });

  it('should handle params with different array formats', () => {
    const customSerializer = (params: any) => {
      const parts: string[] = [];
      Object.keys(params).forEach(key => {
        if (Array.isArray(params[key])) {
          params[key].forEach((value: any) => {
            parts.push(`${key}[]=${value}`);
          });
        } else {
          parts.push(`${key}=${params[key]}`);
        }
      });
      return parts.join('&');
    };
    const result = buildURL('/api', { ids: [1, 2, 3] }, customSerializer);
    expect(result).toBe('/api?ids[]=1&ids[]=2&ids[]=3');
  });
});