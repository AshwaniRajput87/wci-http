import { describe, test, expect, vi, beforeEach } from "vitest";
import * as client from "../../src/client/httpClient";
import { del } from "../../src/requests/delete";
import { ApiSuccessResponse } from "../../src/types/success.types";

describe("delete request wrapper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("should call httpClient with DELETE method and correct URL", async () => {
    const mockApiResponse: ApiSuccessResponse<any> = { success: true, message: "OK", data: null };
    const httpClientSpy = vi.spyOn(client, "httpClient").mockResolvedValue(mockApiResponse.data); // Resolve with null

    const result = await del<null>("/items/1"); // result will be null

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/items/1",
        method: "DELETE",
      }),
    );
    expect(result).toBeNull(); // Corrected assertion
  });

  test("should forward additional configuration (headers, params)", async () => {
    const mockApiResponse: ApiSuccessResponse<any> = { success: true, message: "OK", data: null };
    const httpClientSpy = vi.spyOn(client, "httpClient").mockResolvedValue(mockApiResponse);
    const config = {
      headers: { Authorization: "Bearer token" },
      query: { force: true },
      timeoutMs: 5000,
    };

    await del("/resource/1", config);

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/resource/1",
        method: "DELETE",
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

    await expect(del("/fail")).rejects.toThrow("Network Failure");
  });

  test("should not allow overriding the DELETE method", async () => {
    const mockApiResponse: ApiSuccessResponse<any> = { success: true, message: "OK", data: null };
    const httpClientSpy = vi.spyOn(client, "httpClient").mockResolvedValue(mockApiResponse);
    // @ts-expect-error - testing that users can't pass 'method' to del()
    await del("/test", { method: "POST" });

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "DELETE",
      }),
    );
  });
});
