import { describe, test, expect, vi, beforeEach } from "vitest";
import * as client from "../../src/client/httpClient";
import { optionsReq } from "../../src/requests/options";
import { ApiSuccessResponse } from "../../src/types/success.types";

describe("options request wrapper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("should call httpClient with OPTIONS method and correct URL", async () => {
    const mockApiResponse: ApiSuccessResponse<any> = { success: true, message: "OK", data: null };
    const httpClientSpy = vi.spyOn(client, "httpClient").mockResolvedValue(mockApiResponse);

    const result = await optionsReq("/items");

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/items",
        method: "OPTIONS",
      }),
    );
    expect(result).toEqual(mockApiResponse);
  });

  test("should forward additional configuration (headers, params)", async () => {
    const mockApiResponse: ApiSuccessResponse<any> = { success: true, message: "OK", data: null };
    const httpClientSpy = vi.spyOn(client, "httpClient").mockResolvedValue(mockApiResponse);
    const config = {
      headers: { "Access-Control-Request-Headers": "Content-Type" },
      query: { detailed: true },
      timeoutMs: 5000,
    };

    await optionsReq("/resource", config);

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/resource",
        method: "OPTIONS",
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

    await expect(optionsReq("/fail")).rejects.toThrow("Network Failure");
  });

  test("should not allow overriding the OPTIONS method", async () => {
    const mockApiResponse: ApiSuccessResponse<any> = { success: true, message: "OK", data: null };
    const httpClientSpy = vi.spyOn(client, "httpClient").mockResolvedValue(mockApiResponse);
    // @ts-expect-error - testing that users can't pass 'method' to optionsReq()
    await optionsReq("/test", { method: "POST" });

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "OPTIONS",
      }),
    );
  });
});
