/**
 * Generic object utilities.
 *
 * Purpose:
 * - Provide small, reusable helpers for object transformation.
 *
 * Usage:
 * - Used internally by infra modules (errors, constants, mappings).
 *
 * Notes:
 * - No domain logic.
 * - No side effects beyond explicit intent.
 */

export const freeze = <T extends object>(obj: T): Readonly<T> =>
  Object.freeze(obj);

export const mapValues = <
  T extends Record<string, string>,
  R
>(
  source: T,
  mapper: (value: string) => R
): Record<string, R> =>
  Object.fromEntries(
    Object.values(source).map(value => [value, mapper(value)])
  );

export const mapValuesAndFreeze = <
  T extends Record<string, string>,
  R
>(
  source: T,
  mapper: (value: string) => R
): Readonly<Record<string, R>> =>
  freeze(mapValues(source, mapper));
