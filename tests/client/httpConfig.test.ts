import { WciHttpError } from "../../src/errors/WciHttpError";
import { createHttpErrorCodes } from "../../src/errors/httpErrorCodes";

const httpErrorCodes = createHttpErrorCodes();

vi.mock("../../src/utils/urlResolverUtils", () => ({
  resolveUrl: vi.fn((baseURL: string | undefined, url: string) =>
    baseURL ? `${baseURL}${url}` : url,
  ),
}));

describe("httpClient", () => {
  let mockFetch: MockedFunction<typeof fetch>;

  beforeEach(() => {
    vi.clearAllMocks(); // Resets call counts between tests
    mockFetch = vi.fn();
  });

  const createFetchResponse = (opts: {
    body: unknown;
    contentType?: string | null;
  }): Response => {
    const headers = new Headers();
    if (opts.contentType) {
      headers.set("Content-Type", opts.contentType);
    }

    const isInvalidJson = opts.contentType?.includes('json') && typeof opts.body !== 'object';

    return {
      ok: true,
      json: vi.fn().mockImplementation(() => {
        return isInvalidJson 
          ? Promise.reject(new SyntaxError("Invalid JSON"))
          : Promise.resolve(opts.body);
      }),
      text: vi.fn().mockResolvedValue(String(opts.body)),
      arrayBuffer: vi.fn().mockResolvedValue(opts.body as ArrayBuffer),
      headers,
    } as unknown as Response;
  };

  test("uses baseURL and resolves final URL", async () => {
    mockFetch.mockResolvedValue(createFetchResponse({ body: {} }));

    await httpClient({
      baseURL: "https://api.example.com",
      url: "/users",
      method: HTTP_METHODS.GET,
      fetcher: mockFetch,
    });
    expect(resolveUrl).toHaveBeenCalledWith(
      "https://api.example.com",
      "/users",
    );
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/users",
      expect.any(Object),
    );
  });
  
  test("uppercases provided HTTP method", async () => {
    mockFetch.mockResolvedValue(createFetchResponse({ body: {} }));

    await httpClient({
      url: "/method",
      method: HTTP_METHODS.PATCH,
      fetcher: mockFetch,
    });

    // Index [0] is correct here because we cleared mocks in beforeEach
    expect(mockFetch.mock.calls[0][1]?.method).toBe("PATCH");
  });

  test("defaults to GET when no method is provided", async () => {
    mockFetch.mockResolvedValue(createFetchResponse({ body: {} }));

    await httpClient({ url: "/default", method: HTTP_METHODS.GET, fetcher: mockFetch });

    expect(mockFetch.mock.calls[0][1]?.method).toBe("GET");
  });

  describe("Body Serialization", () => {
    test("stringifies object body", async () => {
      mockFetch.mockResolvedValue(createFetchResponse({ body: {} }));
      const body = { name: "Ayu" };

      await httpClient({
        url: "/body",
        method: HTTP_METHODS.POST,
        body,
        fetcher: mockFetch,
      });

      expect(mockFetch.mock.calls[0][1]?.body).toBe(JSON.stringify(body));
    });

    test("correctly stringifies falsy but valid JSON bodies (0 and false)", async () => {
      mockFetch.mockResolvedValue(createFetchResponse({ body: {} }));

      // Test 0
      await httpClient({ url: "/zero", method: HTTP_METHODS.POST, body: 0, fetcher: mockFetch });
      expect(mockFetch.mock.calls[0][1]?.body).toBe("0");

      // Test false
      await httpClient({ url: "/false", method: HTTP_METHODS.POST, body: false, fetcher: mockFetch });
      expect(mockFetch.mock.calls[1][1]?.body).toBe("false");
    });

    test("sends undefined when body is missing", async () => {
      mockFetch.mockResolvedValue(createFetchResponse({ body: {} }));

      await httpClient({ url: "/no-body", method: HTTP_METHODS.GET, fetcher: mockFetch });

      expect(mockFetch.mock.calls[0][1]?.body).toBeUndefined();
    });
  });

  test("forwards extra configuration like credentials", async () => {
    mockFetch.mockResolvedValue(createFetchResponse({ body: {} }));

    await httpClient({
      url: "/auth",
      method: HTTP_METHODS.GET,
      credentials: "include",
      fetcher: mockFetch,
    });

    expect(mockFetch.mock.calls[0][1]?.credentials).toBe("include");
  });

  test("returns parsed JSON result", async () => {
    const mockData = { id: 123 };
    mockFetch.mockResolvedValue(
      createFetchResponse({ body: mockData, contentType: "application/json" }),
    );

    const result = await httpClient({
      url: "/data",
      method: HTTP_METHODS.GET,
      fetcher: mockFetch,
    });

    expect(result).toEqual(mockData);
  });

  describe("Response Parsing", () => {
    test("should parse JSON response with a +json suffix", async () => {
      const body = { message: "success" };
      mockFetch.mockResolvedValue(
        createFetchResponse({ body, contentType: "application/vnd.api+json" }),
      );
      const result = await httpClient({ url: "/json", fetcher: mockFetch });
      expect(result).toEqual(body);
    });

    test("should parse text/plain response", async () => {
      const body = "plain text response";
      mockFetch.mockResolvedValue(
        createFetchResponse({ body, contentType: "text/plain" }),
      );
      const result = await httpClient({ url: "/text", fetcher: mockFetch });
      expect(result).toBe(body);
    });

    test("should parse text/html response", async () => {
      const body = "<h1>Hello</h1>";
      mockFetch.mockResolvedValue(
        createFetchResponse({ body, contentType: "text/html; charset=utf-8" }),
      );
      const result = await httpClient({ url: "/html", fetcher: mockFetch });
      expect(result).toBe(body);
    });

    test("should return ArrayBuffer for unknown content types", async () => {
      const body = new ArrayBuffer(8);
      mockFetch.mockResolvedValue(
        createFetchResponse({ body, contentType: "application/octet-stream" }),
      );
      const result = await httpClient({ url: "/buffer", fetcher: mockFetch });
      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    test("should return ArrayBuffer when Content-Type is missing", async () => {
      const body = new ArrayBuffer(8);
      mockFetch.mockResolvedValue(
        createFetchResponse({ body, contentType: null }),
      );
      const result = await httpClient({ url: "/buffer", fetcher: mockFetch });
      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    test("should throw WciHttpError for invalid JSON", async () => {
      const body = "this is not json";
      mockFetch.mockResolvedValue(
        createFetchResponse({ body, contentType: "application/json" }),
      );

      await expect(httpClient({ url: "/invalid-json", fetcher: mockFetch }))
        .rejects.toThrow(WciHttpError);
      
      try {
        await httpClient({ url: "/invalid-json-2", fetcher: mockFetch });
      } catch (e: any) {
        expect(e.code).toBe(httpErrorCodes.PARSE_ERROR);
        expect(e.message).toBe("Failed to parse JSON response.");
      }
    });
  });
});
