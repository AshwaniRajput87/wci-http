import { describe, test, expect, vi, beforeEach } from "vitest";
import { WciLogger, HttpRequest, RequestInterceptor, ResponseInterceptor } from "../../src/types/http.types";
import { createLoggingInterceptors } from "../../src/interceptors/loggingInterceptor";

describe("logging interceptors", () => {
  let mockLogger: WciLogger;
  let requestInterceptor: RequestInterceptor;
  let responseInterceptor: ResponseInterceptor;

  beforeEach(() => {
    mockLogger = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
    };
    const interceptors = createLoggingInterceptors(mockLogger);
    requestInterceptor = interceptors.requestInterceptor;
    responseInterceptor = interceptors.responseInterceptor;
  });

  test("requestInterceptor should log the outgoing request", async () => {
    const mockRequest: HttpRequest = {
      url: "/api/users",
      method: "GET",
      headers: {},
    };

    await requestInterceptor(mockRequest);

    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "info",
        category: "http",
        message: expect.stringContaining("REQUEST → GET /api/users"),
        url: "/api/users",
        method: "GET",
      }),
    );
  });

  test("requestInterceptor should log request body if present", async () => {
    const mockRequestWithBody: HttpRequest = {
      url: "/api/items",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "item1" }),
    };

    await requestInterceptor(mockRequestWithBody);

    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "debug",
        category: "http",
        message: expect.stringContaining("REQUEST BODY: {\"name\":\"item1\"}"),
      }),
    );
  });

  test("responseInterceptor should log the incoming successful response", async () => {
    const mockRequest: HttpRequest = {
      url: "/api/users",
      method: "GET",
      headers: {},
    };
    const mockResponse: Response = {
      status: 200,
      ok: true,
      headers: new Headers({ "content-length": "100", "content-type": "application/json" }),
      json: async () => ({ id: 1, name: "test" }),
      clone: function() { return this; }
    } as Response;

    // Simulate request start time
    await requestInterceptor(mockRequest); // This sets the start time in the interceptor's internal map
    mockLogger.log = vi.fn(); // Clear previous log calls

    await responseInterceptor(mockResponse, mockRequest);

    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "info", // 200 is info level
        category: "http",
        message: expect.stringContaining("RESPONSE ← GET /api/users [200]"),
        url: "/api/users",
        method: "GET",
        status: 200,
        durationMs: expect.any(Number),
      }),
    );
    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "debug",
        category: "http",
        message: expect.stringContaining("RESPONSE DATA: {\"id\":1,\"name\":\"test\"}"),
        status: 200,
      }),
    );
  });

  test("responseInterceptor should log error level for 5xx status codes", async () => {
    const mockRequest: HttpRequest = {
      url: "/api/error",
      method: "GET",
      headers: {},
    };
    const mockResponse: Response = {
      status: 500,
      ok: false,
      headers: new Headers({ "content-length": "0" }),
      json: async () => ({}), // Mock json method
      clone: function() { return this; }
    } as Response;

    await requestInterceptor(mockRequest); // Simulate request start time
    mockLogger.log = vi.fn();

    await responseInterceptor(mockResponse, mockRequest);

    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "error", // 500 is error level
        category: "http",
        message: expect.stringContaining("RESPONSE ← GET /api/error [500]"),
        status: 500,
        durationMs: expect.any(Number),
      }),
    );
  });

  test("responseInterceptor should not log body for 204 No Content", async () => {
    const mockRequest: HttpRequest = {
      url: "/api/nocontent",
      method: "DELETE",
      headers: {},
    };
    const mockResponse: Response = {
      status: 204,
      ok: true,
      headers: new Headers({ "content-length": "0" }),
      json: async () => ({}),
      clone: function() { return this; }
    } as Response;

    await requestInterceptor(mockRequest);
    mockLogger.log = vi.fn();

    await responseInterceptor(mockResponse, mockRequest);

    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "info",
        message: expect.stringContaining("RESPONSE ← DELETE /api/nocontent [204]"),
        status: 204,
      }),
    );
    expect(mockLogger.log).not.toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("RESPONSE DATA:") }),
    );
  });

  // Test for errorInterceptor if needed, but current tests focus on logging
});
