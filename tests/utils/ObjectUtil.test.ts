import { describe, test, expect } from "vitest";
import {
  freeze,
  mapValues,
  mapValuesAndFreeze,
} from "../../src/utils/objectUtils";

describe("Object Util", () => {
  test("freeze object", () => {
    const obj = freeze({ a: 1 });
    expect(Object.isFrozen(obj)).toBe(true);
  });

  test("maps values correctly", () => {
    const result = mapValues({ A: "X" }, (v) => v + "_1");
    expect(result.X).toBe("X_1");
  });

  test("maps and freezes", () => {
    const result = mapValuesAndFreeze({ A: "X" }, (v) => v);
    expect(Object.isFrozen(result)).toBe(true);
  });
});
