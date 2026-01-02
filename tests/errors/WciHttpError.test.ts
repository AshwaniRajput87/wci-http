import { describe, test, expect } from "vitest";
import { WciHttpError } from "../../src/errors/WciHttpError";

describe("WciHttpError", () => {
  test("should inherit correctly from standard Error", () => {
    const err = new WciHttpError({
      code: "WCI_HTTP_ERROR",
      message: "An error occurred",
    });

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(WciHttpError);
    expect(err.name).toBe("WciHttpError");
    expect(err.message).toBe("An error occurred");
    expect(err.stack).toBeDefined();
  });

  test("should assign all optional properties correctly", () => {
    const options = {
      code: "WCI_HTTP_TIMEOUT",
      message: "Request timed out",
      status: 408,
      method: "GET",
      url: "https://api.example.com/data",
      retryable: true,
      timeout: true,
      cause: new Error("Underlying connection reset"),
    };

    const err = new WciHttpError(options);

    expect(err.code).toBe(options.code);
    expect(err.status).toBe(options.status);
    expect(err.method).toBe(options.method);
    expect(err.url).toBe(options.url);
    expect(err.retryable).toBe(options.retryable);
    expect(err.timeout).toBe(options.timeout);
    expect((err as any).cause).toBe(options.cause);
  });

  test("toJSON() should return a clean serializable object", () => {
    const err = new WciHttpError({
      code: "WCI_HTTP_BAD_REQUEST",
      message: "Missing parameters",
      status: 400,
      retryable: false,
    });

    const json = err.toJSON();

    expect(json).toEqual({
      name: "WciHttpError",
      code: "WCI_HTTP_BAD_REQUEST",
      message: "Missing parameters",
      status: 400,
      retryable: false,
      method: undefined,
      url: undefined,
      timeout: undefined,
      cause: undefined,
    });

    // Ensure it can be stringified without circular reference issues
    expect(JSON.stringify(err)).toBe(JSON.stringify(json));
  });

  test("should handle missing optional properties gracefully", () => {
    const err = new WciHttpError({
      code: "UNKNOWN",
      message: "Minimal error",
    });

    expect(err.status).toBeUndefined();
    expect(err.retryable).toBeUndefined();
    expect((err as any).cause).toBeUndefined();
  });

  test("should preserve prototype chain (Object.setPrototypeOf check)", () => {
    const err = new WciHttpError({ code: "ERR", message: "msg" });

    // This check is crucial for older environments or specific transpilation setups
    expect(Object.getPrototypeOf(err)).toBe(WciHttpError.prototype);
  });
});
