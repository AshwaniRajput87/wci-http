import { describe, it, expect } from 'vitest';
import { mergeWciConfig } from '../../src/utils/mergeConfig';

describe('mergeWciConfig', () => {
  it('applies default -> instance -> request precedence with undefined ignored', () => {
    const defaults = { baseURL: 'https://default', timeout: 100, headers: { common: { Accept: '*/*' } } };
    const instance = { baseURL: 'https://instance', headers: { common: { Authorization: 'token' } }, logging: undefined };
    const request = { baseURL: 'https://request', headers: { get: { 'X-Req': '1' } }, logging: { level: 'info' } };

    const merged = mergeWciConfig(defaults, instance, request);

    expect(merged.baseURL).toBe('https://request');
    expect(merged.headers).toEqual({
      Accept: '*/*',
      Authorization: 'token',
      'X-Req': '1',
    });
    expect(merged.timeoutMs).toBe(100);
    expect(merged.logging?.level).toBe('info');
  });

  it('resolves axios-style headers common/method and de-duplicates casing', () => {
    const merged = mergeWciConfig(
      {
        method: 'get',
        headers: {
          common: { Accept: '*/*' },
          get: { 'X-Inst': '1' },
        },
      },
      {
        headers: {
          get: { 'x-inst': '2', 'Content-Type': 'application/json' },
          post: { 'X-Post': 'noop' },
        },
      },
    );

    expect(merged.headers).toEqual({
      Accept: '*/*',
      'X-Inst': '2',
      'Content-Type': 'application/json',
    });
    expect(Object.keys(merged.headers || {}).filter(k => k.toLowerCase() === 'x-post')).toHaveLength(0);
  });

  it('concatenates transformRequest in instance-first then request-last order', () => {
    const inst = (d: any) => ({ ...d, a: 1 });
    const req = (d: any) => ({ ...d, b: 2 });
    const merged = mergeWciConfig({ transformRequest: inst }, { transformRequest: [req] });

    expect(merged.transformRequest).toEqual([inst, req]);
  });

  it('prefers request adapter over instance over default when provided', () => {
    const defaultCfg = { adapter: 'default' as any };
    const instance = { adapter: 'instance' as any };
    const request = { adapter: 'request' as any };
    const merged = mergeWciConfig(defaultCfg, instance, request);
    expect(merged.adapter).toBe('request');
  });

  it('handles undefined vs null correctly', () => {
    const merged = mergeWciConfig(
      { logging: { level: 'none', logRequestHeaders: false, logResponseHeaders: false } },
      { logging: undefined },
      { logging: null },
    );
    expect(merged.logging).toBeNull();
  });
});
