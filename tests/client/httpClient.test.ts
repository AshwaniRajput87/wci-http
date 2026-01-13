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

vi.mock("../../src/utils/urlResolverUtils", () => ({
  resolveUrl: vi.fn((baseURL: string | undefined, url: string) =>
    baseURL ? `${baseURL}${url}` : url,
  ),
}));

describe("httpClient", () => {
  let mockFetch: MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = vi.fn();
  });

  const createFetchResponse = (data: unknown): Response =>
    ({
      ok: true,
      json: vi.fn().mockResolvedValue(data),
      headers: new Headers(),
    }) as unknown as Response;

  test("uses url directly when baseURL is not provided", async () => {
    mockFetch.mockResolvedValue(createFetchResponse({ success: true }));
    await httpClient({
      url: "/test",
      method: HTTP_METHODS.GET,
      fetcher: mockFetch,
    });

    expect(mockFetch).toHaveBeenCalledWith("/test", expect.any(Object));
  });

  test("resolves baseURL + url when baseURL is provided", async () => {
    mockFetch.mockResolvedValue(createFetchResponse({}));

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
    mockFetch.mockResolvedValue(createFetchResponse({}));

    await httpClient({
      url: "/test",
      fetcher: mockFetch,
    });

  });

  test("uppercases HTTP method", async () => {
    mockFetch.mockResolvedValue(createFetchResponse({}));

    await httpClient({
      url: "/test",
      method: HTTP_METHODS.POST,
      fetcher: mockFetch,
    });

    expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
  });

  test("passes headers correctly", async () => {
    mockFetch.mockResolvedValue(createFetchResponse({}));

    const headers = {
      Authorization: "Bearer token",
    };

    await httpClient({
      url: "/secure",
      method: HTTP_METHODS.GET,
      headers,
      fetcher: mockFetch,
    });

    expect(mockFetch.mock.calls[0][1]?.headers).toEqual(headers);
  });

  test("stringifies body when body is provided", async () => {
    mockFetch.mockResolvedValue(createFetchResponse({}));

    const body = { name: "Ayu" };

    await httpClient({
      url: "/users",
      method: HTTP_METHODS.POST,
      body,
      fetcher: mockFetch,
    });

    expect(mockFetch.mock.calls[0][1]?.body).toBe(JSON.stringify(body));
  });

  test("does not send body when body is undefined", async () => {
    mockFetch.mockResolvedValue(createFetchResponse({}));

    await httpClient({
      url: "/test",
      fetcher: mockFetch,
    });

    expect(mockFetch.mock.calls[0][1]?.body).toBeUndefined();
  });

  test("forwards allowed fetch option: credentials", async () => {
    mockFetch.mockResolvedValue(createFetchResponse({}));

    await httpClient({
      url: "/test",
      method: HTTP_METHODS.GET,
      credentials: "include",
      fetcher: mockFetch,
    });

    const options = mockFetch.mock.calls[0][1];

    expect(options?.credentials).toBe("include");
  });

  test("returns parsed JSON response typed as T", async () => {
    const responseData = { id: 1, name: "Ayu" };
    mockFetch.mockResolvedValue(createFetchResponse(responseData));

    const result = await httpClient<typeof responseData>({
      url: "/user",
      fetcher: mockFetch,
    });

    expect(result).toEqual(responseData);
  });

  test("calls response.json exactly once", async () => {
    const response = createFetchResponse({});
    mockFetch.mockResolvedValue(response);
    await httpClient({
      url: "/test",
      method: HTTP_METHODS.GET,
      fetcher: mockFetch,
    });

    expect(response.json).toHaveBeenCalledTimes(1);
  });
});
