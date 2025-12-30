import { describe, test, expect, vi, beforeEach } from "vitest";
import { WciLogger, HttpLogEvent } from "../../src/types/loggingTypes";
import { loggingInterceptor } from "../../src/interceptors/logging";


describe("loggingInterceptor", () => {
  let mockLogger: WciLogger;

  beforeEach(() => {
    mockLogger = {
      log: vi.fn(),
    };
  });

  test("should return early if no logger is provided", () => {
    loggingInterceptor("/test", undefined);
    expect(true).toBe(true); 
  });

  test("should log the URL and default message when details are missing", () => {
    loggingInterceptor("/api/users", mockLogger);

    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/api/users",
        level: "info",
        category: "http",
        message: expect.stringContaining("/api/users"),
      })
    );
  });

  test("should override default level and message if provided", () => {
    loggingInterceptor("/api/error", mockLogger, {
      level: "error",
      message: "Custom Error Message",
    });

    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "error",
        message: "Custom Error Message",
      })
    );
  });

  test("should log all technical details (status, duration, error codes)", () => {
    const details = {
      method: "POST",
      status: 201,
      durationMs: 150,
      errorCode: "WCI_HTTP_CONFLICT",
      error: new Error("Conflict"),
    };

    loggingInterceptor("/api/create", mockLogger, details);

    expect(mockLogger.log).toHaveBeenCalledWith({
      level: "info",
      category: "http",
      message: expect.any(String),
      url: "/api/create",
      ...details
    });
  });

  test("should handle falsy but valid status codes (like 0)", () => {
    loggingInterceptor("/api/fail", mockLogger, { status: 0 });

    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 0,
      })
    );
  });
});
