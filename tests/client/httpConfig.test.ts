import {
  describe,
  test,
  expect,
  vi,
  beforeEach,
  type MockedFunction,
} from "vitest";
import { httpClient } from "../../src/client/httpClient";
import { resolveUrl } from "../../src/utils/urlResolverUtils";

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

  const createFetchResponse = (data: unknown): Response =>
    ({
      ok: true,
      json: vi.fn().mockResolvedValue(data),
    }) as unknown as Response;

  test("uses baseURL and resolves final URL", async () => {
    mockFetch.mockResolvedValue(createFetchResponse({}));

    await httpClient({
      baseURL: "https://api.example.com",
      url: "/users",
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
    mockFetch.mockResolvedValue(createFetchResponse({}));

    await httpClient({
      url: "/method",
      method: "patch",
      fetcher: mockFetch,
    });

    // Index [0] is correct here because we cleared mocks in beforeEach
    expect(mockFetch.mock.calls[0][1]?.method).toBe("PATCH");
  });

  test("defaults to GET when no method is provided", async () => {
    mockFetch.mockResolvedValue(createFetchResponse({}));

    await httpClient({ url: "/default", fetcher: mockFetch });

    expect(mockFetch.mock.calls[0][1]?.method).toBe("GET");
  });

  describe("Body Serialization", () => {
    test("stringifies object body", async () => {
      mockFetch.mockResolvedValue(createFetchResponse({}));
      const body = { name: "Ayu" };

      await httpClient({
        url: "/body",
        method: "POST",
        body,
        fetcher: mockFetch,
      });

      expect(mockFetch.mock.calls[0][1]?.body).toBe(JSON.stringify(body));
    });

    test("correctly stringifies falsy but valid JSON bodies (0 and false)", async () => {
      mockFetch.mockResolvedValue(createFetchResponse({}));

      // Test 0
      await httpClient({ url: "/zero", body: 0, fetcher: mockFetch });
      expect(mockFetch.mock.calls[0][1]?.body).toBe("0");

      // Test false - checking index [1] because this is the second call in this test
      await httpClient({ url: "/false", body: false, fetcher: mockFetch });
      expect(mockFetch.mock.calls[1][1]?.body).toBe("false");
    });

    test("sends undefined when body is missing", async () => {
      mockFetch.mockResolvedValue(createFetchResponse({}));

      await httpClient({ url: "/no-body", fetcher: mockFetch });

      expect(mockFetch.mock.calls[0][1]?.body).toBeUndefined();
    });
  });

  test("forwards extra configuration like credentials", async () => {
    mockFetch.mockResolvedValue(createFetchResponse({}));

    await httpClient({
      url: "/auth",
      credentials: "include",
      fetcher: mockFetch,
    });

    expect(mockFetch.mock.calls[0][1]?.credentials).toBe("include");
  });

  test("returns parsed JSON result", async () => {
    const mockData = { id: 123 };
    mockFetch.mockResolvedValue(createFetchResponse(mockData));

    const result = await httpClient({
      url: "/data",
      fetcher: mockFetch,
    });

    expect(result).toEqual(mockData);
  });
});
