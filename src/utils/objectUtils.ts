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

export const mapValues = <T extends Record<string, string>, R>(
  source: T,
  mapper: (value: T[keyof T]) => R,
): Record<T[keyof T], R> =>
  Object.fromEntries(
    Object.values(source).map((value) => [value, mapper(value as T[keyof T])]),
  ) as Record<T[keyof T], R>;

export const mapValuesAndFreeze = <T extends Record<string, string>, R>(
  source: T,
  mapper: (value: T[keyof T]) => R,
): Readonly<Record<T[keyof T], R>> => freeze(mapValues(source, mapper));

export const values = <T extends object>(obj: T): Array<T[keyof T]> =>
  Object.values(obj) as Array<T[keyof T]>;

export const entries = <T extends object>(
  obj: T,
): Array<[keyof T, T[keyof T]]> =>
  Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
