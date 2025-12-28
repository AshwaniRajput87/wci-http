import { describe, it, expect, vi } from 'vitest';
import * as client from '../../src/client/httpClient';
import { post } from '../../src/requests/post';

describe('post', () => {
  it('calls httpClient with headers', async () => {
    const spy = vi.spyOn(client, 'httpClient')
      .mockResolvedValue('ok' as any);

    await post('/test', { a: 1 });
    expect(spy).toHaveBeenCalled();
  });
});
