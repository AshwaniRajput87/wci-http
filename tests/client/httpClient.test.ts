import {
  describe,
  test,
  expect,
  vi,
  beforeEach,
} from "vitest";

import { HTTP_METHODS } from "../../src/constants/httpMethods";
import { httpClient } from "../../src/client/httpClient";
import type { HttpClientFetcher } from "../../src/types/http.types";
import { createHttpErrorCodes } from "../../src/errors/httpErrorCodes";

const httpErrorCodes = createHttpErrorCodes();

vi.mock("../../src/utils/urlResolverUtils", () => ({
  resolveUrl: vi.fn((baseURL: string | undefined, url: string) =>
    baseURL ? `${baseURL}${url}` : url,
  ),
}));

describe("httpClient", () => {
  let mockFetch: HttpClientFetcher;

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
        } catch (e) {
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

  test("uses url directly when baseURL is not provided", async () => {
    (mockFetch as any).mockResolvedValue(
      createFetchResponse({
        body: { success: true },
        contentType: "application/json",
      }),
    );

    await httpClient({
      url: "/test",
      method: HTTP_METHODS.GET,
      fetcher: mockFetch,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/test",
      expect.any(Object),
    );
  });

  test("resolves baseURL + url when baseURL is provided", async () => {
    (mockFetch as any).mockResolvedValue(
      createFetchResponse({
        body: {},
        contentType: "application/json",
      }),
    );

    await httpClient({
      baseURL: "https://api.example.com",
      url: "/users",
      method: HTTP_METHODS.GET,
      fetcher: mockFetch,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/users",
      expect.any(Object),
    );
  });

  test("defaults method to GET", async () => {
    (mockFetch as any).mockResolvedValue(
      createFetchResponse({
        body: {},
        contentType: "application/json",
      }),
    );

    await httpClient({
      url: "/test",
      fetcher: mockFetch,
    });

    expect(
      (mockFetch as any).mock.calls[0][1]?.method,
    ).toBe("GET");
  });

  test("uppercases HTTP method", async () => {
    (mockFetch as any).mockResolvedValue(
      createFetchResponse({
        body: {},
        contentType: "application/json",
      }),
    );

    await httpClient({
      url: "/test",
      method: HTTP_METHODS.POST,
      fetcher: mockFetch,
    });

    expect(
      (mockFetch as any).mock.calls[0][1]?.method,
    ).toBe("POST");
  });

  test("passes headers correctly", async () => {
    (mockFetch as any).mockResolvedValue(
      createFetchResponse({
        body: {},
        contentType: "application/json",
      }),
    );

    const headers = {
      Authorization: "Bearer token",
    };

    await httpClient({
      url: "/secure",
      headers,
      fetcher: mockFetch,
    });

    expect(
      (mockFetch as any).mock.calls[0][1]?.headers,
    ).toEqual(headers);
  });

  test("stringifies body when body is provided", async () => {
    (mockFetch as any).mockResolvedValue(
      createFetchResponse({
        body: {},
        contentType: "application/json",
      }),
    );

    const body = { name: "Ayu" };

    await httpClient({
      url: "/users",
      method: HTTP_METHODS.POST,
      body,
      fetcher: mockFetch,
    });

    expect(
      (mockFetch as any).mock.calls[0][1]?.body,
    ).toBe(JSON.stringify(body));
  });

  test("does not send body when body is undefined", async () => {
    (mockFetch as any).mockResolvedValue(
      createFetchResponse({
        body: {},
        contentType: "application/json",
      }),
    );

    await httpClient({
      url: "/test",
      fetcher: mockFetch,
    });

    expect(
      (mockFetch as any).mock.calls[0][1]?.body,
    ).toBeUndefined();
  });

  test("returns parsed JSON response typed as T", async () => {
    const responseData = { id: 1, name: "Ayu" };

    (mockFetch as any).mockResolvedValue(
      createFetchResponse({
        body: responseData,
        contentType: "application/json",
      }),
    );

    const result = await httpClient<typeof responseData>({
      url: "/user",
      fetcher: mockFetch,
    });

    expect(result).toEqual(responseData);
  });

  test("calls response.json exactly once", async () => {
    const response = createFetchResponse({
      body: {},
      contentType: "application/json",
    });

    (mockFetch as any).mockResolvedValue(response);

    await httpClient({
      url: "/test",
      fetcher: mockFetch,
    });

    expect(response.text).toHaveBeenCalledTimes(1);
  });

  test("should throw WciHttpError for invalid JSON", async () => {
    (mockFetch as any).mockResolvedValue(
      createFetchResponse({
        body: "not-json",
        contentType: "application/json",
      }),
    );

    await expect(
      httpClient({
        url: "/invalid-json",
        fetcher: mockFetch,
      }),
    ).rejects.toMatchObject({
      name: "WciHttpError",
      code: httpErrorCodes.INVALID_JSON,
    });
  });

  describe("responseType handling", () => {
    test("should parse response as JSON when responseType is 'json'", async () => {
      const responseData = { id: 1, name: "Test" };
      const response = createFetchResponse({
        body: responseData,
        contentType: "application/json",
      });
      (mockFetch as any).mockResolvedValue(response);

      const result = await httpClient({
        url: "/test",
        responseType: 'json',
        fetcher: mockFetch,
      });

      expect(result).toEqual(responseData);
      expect(response.json).toHaveBeenCalledTimes(1);
    });

    test("should parse response as text when responseType is 'text'", async () => {
      const responseData = "plain text";
      const response = createFetchResponse({
        body: responseData,
        contentType: "text/plain",
      });
      (mockFetch as any).mockResolvedValue(response);

      const result = await httpClient({
        url: "/test",
        responseType: 'text',
        fetcher: mockFetch,
      });

      expect(result).toEqual(responseData);
      expect(response.text).toHaveBeenCalledTimes(1);
    });

    test("should parse response as ArrayBuffer when responseType is 'arraybuffer'", async () => {
      const responseData = new ArrayBuffer(8);
      const response = createFetchResponse({
        body: responseData,
        contentType: "application/octet-stream",
      });
      (mockFetch as any).mockResolvedValue(response);

      const result = await httpClient({
        url: "/test",
        responseType: 'arraybuffer',
        fetcher: mockFetch,
      });

      expect(result).toEqual(responseData);
      expect(response.arrayBuffer).toHaveBeenCalledTimes(1);
    });

    test("should parse response as Blob when responseType is 'blob'", async () => {
      const responseData = "some data";
      const blob = new Blob([responseData]);
      const response = createFetchResponse({
          body: blob,
          contentType: "application/octet-stream",
      });
      (mockFetch as any).mockResolvedValue(response);

      const result = await httpClient<Blob>({
          url: "/test",
          responseType: 'blob',
          fetcher: mockFetch,
      });

      expect(result).toBeInstanceOf(Blob);
      expect(await result.text()).toEqual(responseData)
      expect(response.blob).toHaveBeenCalledTimes(1);
    });

    test("should return ReadableStream when responseType is 'stream'", async () => {
        const stream = new ReadableStream();
        const response = createFetchResponse({
            body: stream, // Pass the stream directly to createFetchResponse
            contentType: "application/octet-stream", // Add a content type for realism
        });

        (mockFetch as any).mockResolvedValue(response);

        const result = await httpClient({
            url: "/test",
            responseType: 'stream',
            fetcher: mockFetch,
        });

        expect(result).toBe(stream);
    });

    test("should throw for invalid JSON when responseType is 'json'", async () => {
        const response = createFetchResponse({
            body: "invalid-json",
            contentType: "application/json",
        });
        (mockFetch as any).mockResolvedValue(response);

        await expect(httpClient({
            url: "/test",
            responseType: 'json',
            fetcher: mockFetch,
        })).rejects.toMatchObject({
            code: httpErrorCodes.INVALID_JSON
        });
    });

    test("should fall back to content-type detection if responseType is not provided", async () => {
        const responseData = { id: 1, name: "Test" };
        const response = createFetchResponse({
            body: responseData,
            contentType: "application/json",
        });
        (mockFetch as any).mockResolvedValue(response);

        const result = await httpClient({
            url: "/test",
            fetcher: mockFetch,
        });

        expect(result).toEqual(responseData);
        expect(response.text).toHaveBeenCalledTimes(1);
    });
  });

  describe("method shortcuts", () => {
    test("httpClient.get should make a GET request", async () => {
      (mockFetch as any).mockResolvedValue(createFetchResponse({ body: { success: true } }));

      await httpClient.get("/test-get", { fetcher: mockFetch });

      const fetchCall = (mockFetch as any).mock.calls[0];
      expect(fetchCall[0]).toBe("/test-get");
      expect(fetchCall[1].method).toBe("GET");
    });

    test("httpClient.post should make a POST request with data", async () => {
      (mockFetch as any).mockResolvedValue(createFetchResponse({ body: { success: true } }));
      const postData = { name: "test" };

      await httpClient.post("/test-post", postData, { fetcher: mockFetch });

      const fetchCall = (mockFetch as any).mock.calls[0];
      expect(fetchCall[0]).toBe("/test-post");
      expect(fetchCall[1].method).toBe("POST");
      expect(fetchCall[1].body).toBe(JSON.stringify(postData));
    });

    test("httpClient.put should make a PUT request with data", async () => {
      (mockFetch as any).mockResolvedValue(createFetchResponse({ body: { success: true } }));
      const putData = { name: "test-updated" };

      await httpClient.put("/test-put", putData, { fetcher: mockFetch });

      const fetchCall = (mockFetch as any).mock.calls[0];
      expect(fetchCall[0]).toBe("/test-put");
      expect(fetchCall[1].method).toBe("PUT");
      expect(fetchCall[1].body).toBe(JSON.stringify(putData));
    });

    test("httpClient.delete should make a DELETE request", async () => {
      (mockFetch as any).mockResolvedValue(createFetchResponse({ body: {} }));

      await httpClient.delete("/test-delete", { fetcher: mockFetch });

      const fetchCall = (mockFetch as any).mock.calls[0];
      expect(fetchCall[0]).toBe("/test-delete");
      expect(fetchCall[1].method).toBe("DELETE");
    });

    test("httpClient.patch should make a PATCH request with data", async () => {
      (mockFetch as any).mockResolvedValue(createFetchResponse({ body: { success: true } }));
      const patchData = { status: "applied" };

      await httpClient.patch("/test-patch", patchData, { fetcher: mockFetch });

      const fetchCall = (mockFetch as any).mock.calls[0];
      expect(fetchCall[0]).toBe("/test-patch");
      expect(fetchCall[1].method).toBe("PATCH");
      expect(fetchCall[1].body).toBe(JSON.stringify(patchData));
    });

    test("httpClient.head should make a HEAD request", async () => {
      // HEAD requests typically have no body in response, but we need to mock a successful fetch
      (mockFetch as any).mockResolvedValue(createFetchResponse({ body: null, status: 200 }));

      await httpClient.head("/test-head", { fetcher: mockFetch });

      const fetchCall = (mockFetch as any).mock.calls[0];
      expect(fetchCall[0]).toBe("/test-head");
      expect(fetchCall[1].method).toBe("HEAD");
      // HEAD requests should not have a body in the request
      expect(fetchCall[1].body).toBeUndefined();
    });

    test("httpClient.options should make an OPTIONS request", async () => {
      (mockFetch as any).mockResolvedValue(createFetchResponse({ body: null, status: 200 }));

      await httpClient.options("/test-options", { fetcher: mockFetch });

      const fetchCall = (mockFetch as any).mock.calls[0];
      expect(fetchCall[0]).toBe("/test-options");
      expect(fetchCall[1].method).toBe("OPTIONS");
      // OPTIONS requests should not have a body in the request
      expect(fetchCall[1].body).toBeUndefined();
    });
  });
});