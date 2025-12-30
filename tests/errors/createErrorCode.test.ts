import { describe, test, expect } from "vitest";
import { createErrorCodeFactory } from "../../src/errors/createErrorCode";


describe("createErrorCodeFactory", () => {
  const create = createErrorCodeFactory("WCI");

  describe("Normalization Logic", () => {
   test("should transform strings to uppercase and replace spaces with underscores", () => {
      const code = create("http", "not found");
      expect(code).toBe("WCI_HTTP_NOT_FOUND");
    });

    test("should handle multiple spaces and special characters", () => {
      const code = create("auth-domain", "invalid @ token!");
      expect(code).toBe("WCI_AUTH_DOMAIN_INVALID_TOKEN_");
    });

    test("should throw if domain or key is empty or whitespace", () => {
      expect(() => create("", "KEY")).toThrow("[WCI] domain must be a non-empty string");
      expect(() => create("HTTP", "  ")).toThrow("[WCI] key must be a non-empty string");
    });
  });

  describe("Custom Prefix", () => {
    test("should allow overriding the default prefix", () => {
      const customCreate = createErrorCodeFactory("APP");
      expect(customCreate("SYS", "ERR")).toBe("APP_SYS_ERR");
    });
  });
});
