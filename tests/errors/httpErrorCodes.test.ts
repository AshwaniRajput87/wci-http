import { describe, it, expect } from 'vitest';
import { createHttpErrorCodes } from '../../src/errors/httpErrorCodes';

describe('createHttpErrorCodes', () => {
  it('creates default WCI codes', () => {
    const codes = createHttpErrorCodes();
    expect(codes.NETWORK_ERROR).toBe('WCI_HTTP_NETWORK_ERROR');
  });

  it('supports custom prefix', () => {
    const codes = createHttpErrorCodes('ACME');
    expect(codes.TIMEOUT).toBe('ACME_HTTP_TIMEOUT');
  });
});
