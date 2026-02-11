import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { WciHttp } from "../../src/client/WciHttp";
import { WciHttpError } from "../../src/errors/WciHttpError";

describe("validateStatus", () => {
  let wciHttp: WciHttp;
  let mockFetch: vi.Mock;

  beforeEach(() => {
    mockFetch = vi.fn();
    wciHttp = new WciHttp({
      baseURL: "http://localhost",
      fetcher: mockFetch as any,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create a mock Response object with mocked json/text methods
  const createMockResponse = (opts: {
    body: unknown; // Can be object, string, ArrayBuffer, Blob, ReadableStream
    contentType?: string | null;
    ok?: boolean;
    status?: number;
    statusText?: string;
  }): Response => {
    const headers = new Headers();
    if (opts.contentType) {
      headers.set("Content-Type", opts.contentType);
    }

    // Helper to get text representation of body
    const getBodyAsText = (): string => {
      if (typeof opts.body === "string") {
        return opts.body;
      }
      if (typeof opts.body === "object" && opts.body !== null) {
        if (opts.body instanceof Blob) {
          return "[Blob Data]";
        }
        if (opts.body instanceof ReadableStream) {
          return "[ReadableStream Data]";
        }
        return JSON.stringify(opts.body);
      }
      return String(opts.body);
    };

    const rawTextBody = getBodyAsText();

    const jsonMock = vi.fn().mockImplementation(() => {
      // Handle null or empty string bodies as resolving to null for JSON.
      // This is an Axios-like behavior for "empty JSON".
      if (opts.body === null || (typeof opts.body === "string" && !opts.body.trim())) {
        return Promise.resolve(null);
      }

      if (opts.contentType?.includes("json")) {
        try {
          const parsed = typeof opts.body === "string" ? JSON.parse(opts.body) : opts.body;
          if (typeof parsed === 'object' && parsed !== null) {
            return Promise.resolve(parsed);
          }
          return Promise.reject(new SyntaxError("Response body is not a valid JSON object/array"));
        } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
          return Promise.reject(new SyntaxError("Invalid JSON"));
        }
      }
      return Promise.reject(new TypeError("Response not JSON"));
    });
    const textMock = vi.fn().mockResolvedValue(rawTextBody);

    const arrayBufferMock = vi.fn().mockImplementation(() => {
      if (opts.body instanceof ArrayBuffer) {
        return Promise.resolve(opts.body);
      }
      const encoder = new TextEncoder();
      return Promise.resolve(encoder.encode(rawTextBody).buffer);
    });

    const blobMock = vi.fn().mockImplementation(() => {
      if (opts.body instanceof Blob) {
        return Promise.resolve(opts.body);
      }
      return Promise.resolve(new Blob([rawTextBody], { type: opts.contentType || 'application/octet-stream' }));
    });

    const response: Response = {
      ok: opts.ok ?? ((opts.status ?? 200) >= 200 && (opts.status ?? 200) < 300),
      status: opts.status ?? 200,
      statusText: opts.statusText ?? String(opts.status ?? 200),
      headers,
      body: opts.body instanceof ReadableStream ? opts.body : null,
      json: jsonMock,
      text: textMock,
      arrayBuffer: arrayBufferMock,
      blob: blobMock,
      url: "mock-url",
      redirected: false,
      type: "default",
      clone: vi.fn(() => createMockResponse(opts)),
    };

    return response;
  };

  test("should not throw an error if validateStatus returns true for a non-2xx status", async () => {
    // We expect the request to be treated as successful, so the result should be undefined or null for no body
    const mockResponse = createMockResponse({
      body: null,
      status: 404,
      statusText: "Not Found",
      contentType: "application/json",
    });
    mockFetch.mockResolvedValueOnce(mockResponse);

    const result = await wciHttp.get("/data", {
      validateStatus: (status) => status === 404,
    });
    expect(result.data).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test("should throw a WciHttpError if validateStatus returns false for a 2xx status", async () => {
    const responseBody = { message: "Success" };
    const mockResponse = createMockResponse({
      body: responseBody,
      status: 200,
      statusText: "OK",
      contentType: "application/json",
    });
    mockFetch.mockResolvedValueOnce(mockResponse);

    let error: WciHttpError | undefined;
    try {
      await wciHttp.get("/data", {
        validateStatus: (status) => status !== 200, // Make 200 an invalid status
      });
    } catch (e) {
      error = e as WciHttpError;
    }

    expect(error).toBeInstanceOf(WciHttpError);
    expect(error?.status).toBe(200);
    expect(error?.code).toBe("WCI_HTTP_HTTP_200");
    expect(error?.config).toBeDefined();
    expect(error?.request).toBeDefined();
    expect(error?.response).toBeDefined(); // This is the raw mockResponse object
  });

  test("should use the default validateStatus if not provided", async () => {
    const mockResponse = createMockResponse({
      body: null,
      status: 404,
      statusText: "Not Found",
      contentType: "application/json",
    });
    mockFetch.mockResolvedValueOnce(mockResponse);

    let error: WciHttpError | undefined;
    try {
      await wciHttp.get("/data");
    } catch (e) {
      error = e as WciHttpError;
    }

    expect(error).toBeInstanceOf(WciHttpError);
    expect(error?.status).toBe(404);
    expect(error?.code).toBe("WCI_HTTP_NOT_FOUND");
  });

  test("should correctly handle default 2xx success with validateStatus", async () => {
    const responseBody = { data: "success" };
    const mockResponse = createMockResponse({
      body: responseBody,
      status: 200,
      statusText: "OK",
      contentType: "application/json",
    });
    mockFetch.mockResolvedValueOnce(mockResponse);

    const responseData = await wciHttp.get("/data");
    expect(responseData.data).toEqual({ data: "success" });
  });
});
