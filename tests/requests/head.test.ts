import { describe, test, expect, vi, beforeEach } from "vitest";
import { httpClient } from "../../src/client/httpClient";
import { head } from "../../src/requests/head";

describe("head request wrapper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("should call httpClient.request with HEAD method and correct URL", async () => {
    const httpClientSpy = vi.spyOn(httpClient, "request").mockResolvedValue(null);

    const result = await head<null>("/items/1");

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/items/1",
        method: "head",
      }),
    );
    expect(result).toBeNull();
  });

  test("should forward additional configuration (headers, query)", async () => {
    const httpClientSpy = vi.spyOn(httpClient, "request").mockResolvedValue(null);
    const config = {
      headers: { Authorization: "Bearer token" },
      query: { metaOnly: true },
    };

    await head("/resource/1", config);

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/resource/1",
        method: "head",
        headers: config.headers,
        query: config.query,
      }),
    );
  });

  test("should propagate errors from httpClient.request", async () => {
    vi.spyOn(httpClient, "request").mockRejectedValue(
      new Error("Network Failure"),
    );

    await expect(head("/fail")).rejects.toThrow("Network Failure");
  });

  test("should not allow overriding the HEAD method", async () => {
    const httpClientSpy = vi.spyOn(httpClient, "request").mockResolvedValue(null);
    // @ts-expect-error - testing that users can't pass 'method' to head()
    await head("/test", { method: "GET" });

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "head",
      }),
    );
  });
});
