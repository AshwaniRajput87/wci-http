import { describe, test, expect } from "vitest";
import { HTTP_ERROR_KEYS } from "../../src/errors/errorCatalog";

describe("HTTP_ERROR_KEYS", () => {
  test("defines all required canonical error keys", () => {
    // We check a broad sample of categories (Transport, Client, Server, Parsing)
    const expectedKeys = [
      "NETWORK_ERROR",
      "TIMEOUT",
      "BAD_REQUEST",
      "UNAUTHORIZED",
      "INTERNAL_SERVER_ERROR",
      "INVALID_JSON",
      "UNKNOWN_ERROR",
    ];

    expectedKeys.forEach((key) => {
      expect(HTTP_ERROR_KEYS).toHaveProperty(key);
      // In this specific implementation, key should match value
      expect(HTTP_ERROR_KEYS[key as keyof typeof HTTP_ERROR_KEYS]).toBe(key);
    });
  });

  test("should be immutable (frozen) at runtime", () => {
    // This is an edge case: preventing accidental mutation of the catalog
    expect(Object.isFrozen(HTTP_ERROR_KEYS)).toBe(true);
  });

  test("should not contain empty values", () => {
    // Edge case: ensure no one accidentally assigned an empty string to a key
    Object.values(HTTP_ERROR_KEYS).forEach((value) => {
      expect(value).not.toBe("");
      expect(typeof value).toBe("string");
    });
  });

  test("snapshot match", () => {
    // Optimization: Using a snapshot ensures that if ANY key changes,
    // the test fails. This protects the "Stability" guarantee of your docs.
    expect(HTTP_ERROR_KEYS).toMatchSnapshot();
  });
});
