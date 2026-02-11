import { describe, test, expect, vi, beforeEach } from "vitest";
import { httpClient } from "../../src/client/httpClient";
import type { HttpClientFetcher } from "../../src/types/http.types";

describe("transformResponse", () => {
  let mockFetch: HttpClientFetcher;

  // Adapted from httpClient.test.ts for robust Response mocking
  const createFetchResponse = (opts: {
    body: unknown; // Can be object, string, ArrayBuffer, Blob, ReadableStream
    contentType?: string | null;
    ok?: boolean;
    status?: number;
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
          // For Blob, assume it will be read as text later
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

      // If contentType indicates JSON, try to parse
      if (opts.contentType?.includes("json")) {
        try {
          const parsed = typeof opts.body === "string" ? JSON.parse(opts.body) : opts.body;
          if (typeof parsed === 'object' && parsed !== null) {
            return Promise.resolve(parsed);
          }
          // If it's not a parsable object (e.g., number, boolean directly passed as body)
          return Promise.reject(new SyntaxError("Response body is not a valid JSON object/array"));
        } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
          return Promise.reject(new SyntaxError("Invalid JSON"));
        }
      }
      // If not JSON content type, reject
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
      ok: opts.ok ?? true,
      status: opts.status ?? 200,
      headers,
      // Only directly assign body if it's a ReadableStream, otherwise null
      body: opts.body instanceof ReadableStream ? opts.body : null,
      json: jsonMock,
      text: textMock,
      arrayBuffer: arrayBufferMock,
      blob: blobMock,
      // Mock other Response properties that might be accessed
      statusText: String(opts.status ?? 200),
      url: "mock-url",
      redirected: false,
      type: "default",
      clone: vi.fn(() => createFetchResponse(opts)),
    };

    return response;
  };

  beforeEach(() => {
    mockFetch = vi.fn() as unknown as HttpClientFetcher;
    vi.clearAllMocks();
  });

  test("should apply a single transformResponse function", async () => {
    const originalData = { value: 42 };
    (mockFetch as any).mockResolvedValue(
      createFetchResponse({
        body: originalData,
        contentType: "application/json",
      }),
    );

    const result = await httpClient({
      url: "/test",
      fetcher: mockFetch,
      transformResponse: (data: any, headers: any, status: any) => {
        expect(status).toBe(200);
        expect(headers["content-type"]).toBe("application/json");
        return `Transformed Value: ${data.value}`;
      },
    });

    expect(result.data).toBe("Transformed Value: 42");
  });

  test("should apply an array of transformResponse functions in sequence", async () => {
    const originalData = { amount: 120 };
    (mockFetch as any).mockResolvedValue(
      createFetchResponse({
        body: originalData,
        contentType: "application/json",
      }),
    );

    const result = await httpClient({
      url: "/test",
      fetcher: mockFetch,
      transformResponse: [
        // 1. Add tax
        (data: any) => ({ ...data, amount: data.amount * 1.2 }),
        // 2. Format to a string with currency
        (data: any) => `${data.amount.toFixed(2)}`,
      ],
    });

    expect(result.data).toBe("144.00");
  });

  test("should not transform data if transformResponse is not provided", async () => {
    const originalData = { id: 1, name: "Test Item" };
    (mockFetch as any).mockResolvedValue(
      createFetchResponse({
        body: originalData,
        contentType: "application/json",
      }),
    );

    const result = await httpClient({
      url: "/test",
      fetcher: mockFetch,
    });

    expect(result.data).toEqual(originalData);
  });

  test("should handle async transform functions correctly", async () => {
    const originalData = { id: 2 };
    (mockFetch as any).mockResolvedValue(
      createFetchResponse({
        body: originalData,
        contentType: "application/json",
      }),
    );

    const result = await httpClient({
      url: "/test",
      fetcher: mockFetch,
      transformResponse: [
        async (data: any) => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          return { ...data, step1: true };
        },
        async (data: any) => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          return { ...data, step2: true };
        },
      ],
    });

    expect(result.data).toEqual({ id: 2, step1: true, step2: true });
  });
});
