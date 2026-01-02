import { describe, test, expect } from "vitest";
import { createHttpErrorCodes } from "../../src/errors/httpErrorCodes";

describe("createHttpErrorCodes", () => {
  test("should generate keys with the provided custom prefix", () => {
    const codes = createHttpErrorCodes("APP");

    expect(codes.NETWORK_ERROR).toBe("APP_HTTP_NETWORK_ERROR");
    expect(codes.NOT_FOUND).toBe("APP_HTTP_NOT_FOUND");
  });

  test("should default to WCI prefix when no argument is provided", () => {
    const codes = createHttpErrorCodes();

    expect(codes.BAD_REQUEST).toBe("WCI_HTTP_BAD_REQUEST");
  });

  test("should contain all expected error keys", () => {
    const codes = createHttpErrorCodes();

    expect(codes).toHaveProperty("TIMEOUT");
    expect(codes).toHaveProperty("CONFLICT");
    expect(codes).toHaveProperty("INVALID_JSON");
  });
});
