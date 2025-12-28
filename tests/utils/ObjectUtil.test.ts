import { describe, it, expect } from 'vitest';
import { freeze, mapValues, mapValuesAndFreeze } from '../../src/utils/ObjectUtil';

describe('ObjectUtil', () => {
  it('freezes object', () => {
    const obj = freeze({ a: 1 });
    expect(Object.isFrozen(obj)).toBe(true);
  });

  it('maps values correctly', () => {
    const result = mapValues({ A: 'X' }, v => v + '_1');
    expect(result.X).toBe('X_1');
  });

  it('maps and freezes', () => {
    const result = mapValuesAndFreeze({ A: 'X' }, v => v);
    expect(Object.isFrozen(result)).toBe(true);
  });
});
