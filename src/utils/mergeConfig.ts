/**
 * Checks if a value is a plain object.
 * @param val The value to check.
 * @returns True if the value is a plain object, false otherwise.
 */
const isObject = (val: any): val is object => val !== null && typeof val === 'object' && !Array.isArray(val);

/**
 * Recursively merges two or more configuration objects in an Axios-compatible manner.
 *
 * - Objects are merged recursively.
 * - Arrays and primitives from later objects overwrite earlier ones.
 * - `undefined` values in source objects are skipped and do not overwrite existing values.
 *
 * @param objects A sequence of objects to merge.
 * @returns A new object representing the merged result.
 */
export function deepMerge(...objects: any[]): any {
    const result: any = {};

    for (const source of objects) {
        if (!isObject(source)) {
            continue;
        }

        for (const key in source) {
            const sourceVal = source[key];
            const resultVal = result[key];

            if (sourceVal === undefined) {
                // Axios-like behavior: undefined values do not override existing ones.
                continue;
            }

            if (isObject(resultVal) && isObject(sourceVal)) {
                // Deeply merge nested objects.
                result[key] = deepMerge(resultVal, sourceVal);
            } else {
                // For primitives, arrays, or mismatched types, the source value overwrites.
                result[key] = sourceVal;
            }
        }
    }

    return result;
}
