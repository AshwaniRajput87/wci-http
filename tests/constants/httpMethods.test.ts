import { describe, it, expect } from 'vitest';
import { HTTP_METHODS } from '../../src/constants/httpMethods';

describe('HTTP_METHODS', () => {
  it('contains HTTP verbs', () => {
    expect(HTTP_METHODS.GET).toBe('GET');
    expect(HTTP_METHODS.POST).toBe('POST');
  });
});
