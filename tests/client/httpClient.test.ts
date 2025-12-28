import { describe, it, expect, vi } from 'vitest';
import { httpClient } from '../../src/client/httpClient';

describe('httpClient', () => {
  it('uses fetcher and returns json', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ ok: true }),
    });

    const result = await httpClient('/test', {
      fetcher: mockFetch as any,
    });

    expect(mockFetch).toHaveBeenCalled();
    expect(result).toEqual({ ok: true });
  });
});
