// Shared helper so callers (e.g., mergeConfig) can reuse the exact plain-object check.
export const isPlainObject = (val: any): val is Record<string, any> => {
  if (val === null || typeof val !== 'object' || Array.isArray(val)) return false;

  const proto = Object.getPrototypeOf(val);
  return proto === null || proto === Object.prototype;
};

/**
 * Recursively merges two objects deeply.
 * - Primitive values: Source overrides base.
 * - Plain objects: Recursively merged.
 * - Arrays: Source overwrites base.
 * - `undefined` values in source: Ignored (do not override base).
 * - `null` values in source: Explicitly set (override base).
 * - Non-plain objects (e.g., FormData, URLSearchParams): Source overwrites base.
 *
 * This function does not mutate the input objects.
 *
 * @param base The base object.
 * @param source The source object whose properties will be merged into the base.
 * @returns A new deeply merged object.
 */
export const deepMerge = <T extends Record<string, any>>(base: T | undefined, source: T | undefined): T => {
  const result: T = { ...(isPlainObject(base) ? base : {}) } as T;

  if (!isPlainObject(source)) {
    // If source is not a plain object, and it's not undefined, it overwrites the base.
    // This handles cases where source might be null, an array, or other non-plain object types.
    return source === undefined ? result : source;
  }

  Object.entries(source).forEach(([key, sourceValue]) => {
    if (sourceValue === undefined) {
      // Undefined in source means ignore, don't erase existing values.
      return;
    }

    const baseValue = result[key];

    if (isPlainObject(sourceValue) && isPlainObject(baseValue)) {
      // Both are plain objects, recurse.
      result[key] = deepMerge(baseValue, sourceValue);
    } else if (sourceValue === null) {
      // Explicit null in source means override with null.
      result[key] = null;
    } else if (Array.isArray(sourceValue)) {
      // Arrays overwrite by default (as per current general requirement, interceptors will be special).
      result[key] = sourceValue.slice(); // Create a shallow copy to prevent mutation.
    } else {
      // Primitive, non-plain object, or sourceValue is object but baseValue is not.
      // Source value overrides.
      result[key] = sourceValue;
    }
  });

  return result;
};
