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
    body: unknown;
    contentType?: string | null;
    ok?: boolean;
    status?: number;
  }): Response => {
    const headers = new Headers();

    if (opts.contentType) {
      headers.set("Content-Type", opts.contentType);
    }

    const isInvalidJson =
      opts.contentType?.includes("json") &&
      typeof opts.body === "string";

    return {
      ok: opts.ok ?? true,
      status: opts.status ?? 200,
      headers,
      json: vi.fn().mockImplementation(() =>
        isInvalidJson
          ? Promise.reject(new SyntaxError("Invalid JSON"))
          : Promise.resolve(opts.body),
      ),
      text: vi.fn().mockResolvedValue(String(opts.body)),
      arrayBuffer: vi.fn().mockResolvedValue(
        opts.body as ArrayBuffer,
      ),
    } as unknown as Response;
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

    expect(response.json).toHaveBeenCalledTimes(1);
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
});
