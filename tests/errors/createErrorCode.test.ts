import { describe, it, expect } from 'vitest';
import { createErrorCodeFactory } from '../../src/errors/createErrorCode';

describe('createErrorCodeFactory', () => {
  it('creates correct error code', () => {
    const create = createErrorCodeFactory('WCI');
    expect(create('HTTP', 'TIMEOUT')).toBe('WCI_HTTP_TIMEOUT');
  });

  it('normalizes input', () => {
    const create = createErrorCodeFactory('acme');
    expect(create('http', 'bad request')).toBe('ACME_HTTP_BAD_REQUEST');
  });
});
