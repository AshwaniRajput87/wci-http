import {
  describe,
  test,
  expect,
  vi,
  beforeEach,
  type MockedFunction,
} from "vitest";

import { HTTP_METHODS } from "../../src/constants/httpMethods";
import { httpClient } from "../../src/client/httpClient";
import { resolveUrl } from "../../src/utils/urlResolverUtils";
import { createHttpErrorCodes } from "../../src/errors/httpErrorCodes";

const httpErrorCodes = createHttpErrorCodes();

/* ---------------------------------------------
   Mocks
--------------------------------------------- */
vi.mock("../../src/utils/urlResolverUtils", () => ({
  resolveUrl: vi.fn((baseURL: string | undefined, url: string) =>
    baseURL ? `${baseURL}${url}` : url,
  ),
}));

/* ---------------------------------------------
   Test Suite
--------------------------------------------- */
describe("httpClient", () => {
  let mockFetch: MockedFunction<typeof fetch>;

  beforeEach(() => {
    vi.clearAllMocks();
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

    const isInvalidJson =
      opts.contentType?.includes("json") &&
      typeof opts.body === "string";

    return {
      ok: true,
      headers,
      json: vi.fn().mockImplementation(() =>
        isInvalidJson
          ? Promise.reject(new SyntaxError("Invalid JSON"))
          : Promise.resolve(opts.body),
      ),
      text: vi.fn().mockResolvedValue(String(opts.body)),
      arrayBuffer: vi.fn().mockResolvedValue(opts.body as ArrayBuffer),
    } as unknown as Response;
  };

  /* ---------------------------------------------
     Basic behavior
  --------------------------------------------- */

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

    expect(mockFetch.mock.calls[0][1]?.method).toBe("PATCH");
  });

  test("defaults to GET when no method is provided", async () => {
    mockFetch.mockResolvedValue(createFetchResponse({ body: {} }));

    await httpClient({
      url: "/default",
      fetcher: mockFetch,
    });

    expect(mockFetch.mock.calls[0][1]?.method).toBe("GET");
  });

  /* ---------------------------------------------
     Body Serialization
  --------------------------------------------- */

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

  test("correctly stringifies falsy JSON bodies", async () => {
    mockFetch.mockResolvedValue(createFetchResponse({ body: {} }));

    await httpClient({
      url: "/zero",
      method: HTTP_METHODS.POST,
      body: 0,
      fetcher: mockFetch,
    });

    expect(mockFetch.mock.calls[0][1]?.body).toBe("0");

    await httpClient({
      url: "/false",
      method: HTTP_METHODS.POST,
      body: false,
      fetcher: mockFetch,
    });

    expect(mockFetch.mock.calls[1][1]?.body).toBe("false");
  });

  test("sends undefined when body is missing", async () => {
    mockFetch.mockResolvedValue(createFetchResponse({ body: {} }));

    await httpClient({
      url: "/no-body",
      fetcher: mockFetch,
    });

    expect(mockFetch.mock.calls[0][1]?.body).toBeUndefined();
  });

  /* ---------------------------------------------
     Response Parsing
  --------------------------------------------- */

  test("parses JSON response", async () => {
    const data = { id: 1 };
    mockFetch.mockResolvedValue(
      createFetchResponse({
        body: data,
        contentType: "application/json",
      }),
    );

    const result = await httpClient({
      url: "/json",
      fetcher: mockFetch,
    });

    expect(result).toEqual(data);
  });

  test("parses text response", async () => {
    const body = "hello";
    mockFetch.mockResolvedValue(
      createFetchResponse({
        body,
        contentType: "text/plain",
      }),
    );

    const result = await httpClient({
      url: "/text",
      fetcher: mockFetch,
    });

    expect(result).toBe(body);
  });

  test("returns ArrayBuffer for unknown content-type", async () => {
    const body = new ArrayBuffer(8);
    mockFetch.mockResolvedValue(
      createFetchResponse({
        body,
        contentType: "application/octet-stream",
      }),
    );

    const result = await httpClient({
      url: "/binary",
      fetcher: mockFetch,
    });

    expect(result).toBeInstanceOf(ArrayBuffer);
  });

  /* ---------------------------------------------
     Error handling
  --------------------------------------------- */

  test("throws WciHttpError with INVALID_JSON for bad JSON", async () => {
    mockFetch.mockResolvedValue(
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
});
