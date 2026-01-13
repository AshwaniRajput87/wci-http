import { describe, test, expect, vi, beforeEach } from "vitest";
import * as client from "../../src/client/httpClient";
import { head } from "../../src/requests/head";
import { ApiSuccessResponse } from "../../src/types/success.types";

describe("head request wrapper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("should call httpClient with HEAD method and correct URL", async () => {
    const mockApiResponse: ApiSuccessResponse<any> = { success: true, message: "OK", data: null };
    const httpClientSpy = vi.spyOn(client, "httpClient").mockResolvedValue(mockApiResponse.data); // Resolve with null

    const result = await head<null>("/items/1"); // result will be null

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/items/1",
        method: "HEAD",
      }),
    );
    expect(result).toBeNull(); // Corrected assertion
  });

  test("should forward additional configuration (headers, params)", async () => {
    const mockApiResponse: ApiSuccessResponse<any> = { success: true, message: "OK", data: null };
    const httpClientSpy = vi.spyOn(client, "httpClient").mockResolvedValue(mockApiResponse);
    const config = {
      headers: { Authorization: "Bearer token" },
      query: { metaOnly: true },
      timeoutMs: 5000,
    };

    await head("/resource/1", config);

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/resource/1",
        method: "HEAD",
        headers: config.headers,
        query: config.query,
        timeoutMs: 5000,
      }),
    );
  });

  test("should propagate errors from httpClient", async () => {
    vi.spyOn(client, "httpClient").mockRejectedValue(
      new Error("Network Failure"),
    );

    await expect(head("/fail")).rejects.toThrow("Network Failure");
  });

  test("should not allow overriding the HEAD method", async () => {
    const mockApiResponse: ApiSuccessResponse<any> = { success: true, message: "OK", data: null };
    const httpClientSpy = vi.spyOn(client, "httpClient").mockResolvedValue(mockApiResponse);
    // @ts-expect-error - testing that users can't pass 'method' to head()
    await head("/test", { method: "GET" });

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "HEAD",
      }),
    );
  });
});
