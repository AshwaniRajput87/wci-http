import { describe, test, expect } from "vitest";
import { WciHttpError, isWciHttpError } from "../../src/errors/WciHttpError";
import { HttpRequest } from "../../src/types/http.types";

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

    // Test basic properties
    expect(json).toEqual({
      name: "WciHttpError",
      code: "WCI_HTTP_BAD_REQUEST",
      message: "Missing parameters",
      status: 400,
      method: undefined,
      url: undefined,
      retryable: false,
      timeout: undefined,
      cause: undefined,
      isWciHttpError: true,
      config: undefined,
      request: undefined,
      response: undefined,
    });

    // Ensure it can be stringified without circular reference issues
    expect(JSON.stringify(err)).toBe(JSON.stringify(json));
  });

  test("toJSON() should serialize config, request, and response objects", () => {
    const mockRequest: HttpRequest = {
      url: "https://api.example.com/data",
      method: "POST",
      headers: { "X-Test": "true" },
      // Non-serializable parts should be excluded from toJSON output
      fetcher: (() => {}) as any,
      signal: new AbortController().signal,
    };

    const mockResponse = new Response(null, {
      status: 404,
      statusText: "Not Found",
      headers: { "Content-Type": "application/json" },
    });

    const err = new WciHttpError({
      code: "WCI_HTTP_NOT_FOUND",
      message: "Not Found",
      status: 404,
      config: mockRequest,
      request: mockRequest,
      response: mockResponse,
    });

    const json = err.toJSON();

    // Verify config serialization
    expect(json.config).toBeDefined();
    expect(json.config?.url).toBe(mockRequest.url);
    expect(json.config?.method).toBe(mockRequest.method);
    expect(json.config?.headers).toEqual(mockRequest.headers);
    expect(json.config).not.toHaveProperty("fetcher");
    expect(json.config).not.toHaveProperty("signal");

    // Verify request serialization
    expect(json.request).toBeDefined();

    // Verify response serialization
    expect(json.response).toBeDefined();
    expect(json.response?.status).toBe(404);
    expect(json.response?.statusText).toBe("Not Found");
    expect(json.response?.headers).toEqual({ "content-type": "application/json" });
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
    expect(Object.getPrototypeOf(err)).toBe(WciHttpError.prototype);
  });
});

describe("isWciHttpError", () => {
  test("should return true for a WciHttpError instance", () => {
    const httpError = new WciHttpError({ code: "TEST", message: "test" });
    expect(isWciHttpError(httpError)).toBe(true);
  });

  test("should return false for a standard Error instance", () => {
    const genericError = new Error("A generic error");
    expect(isWciHttpError(genericError)).toBe(false);
  });

  test("should return false for a plain object", () => {
    const plainObject = { message: "I am an object", isWciHttpError: false };
    expect(isWciHttpError(plainObject)).toBe(false);
  });

  test("should return false for an object with a truthy 'isWciHttpError' but not === true", () => {
    const trickyObject = { isWciHttpError: "true" };
    expect(isWciHttpError(trickyObject)).toBe(false);
  });

  test("should return false for null and undefined", () => {
    expect(isWciHttpError(null)).toBe(false);
    expect(isWciHttpError(undefined)).toBe(false);
  });
});
