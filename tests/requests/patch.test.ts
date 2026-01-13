import { describe, test, expect, vi, beforeEach } from "vitest";
import * as client from "../../src/client/httpClient";
import { patch } from "../../src/requests/patch";
import { ApiSuccessResponse } from "../../src/types/success.types";
import { CONTENT_TYPES } from "../../src/constants/protocol/contentTypes";

describe("patch request wrapper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("should call httpClient with PATCH method and JSON header", async () => {
    const mockApiResponse: ApiSuccessResponse<any> = { success: true, message: "OK", data: {} };
    const httpClientSpy = vi.spyOn(client, "httpClient").mockResolvedValue(mockApiResponse);
    const body = { name: "Partial Update" };

    const result = await patch("/items/1", body);

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/items/1",
        method: "PATCH",
        body,
        headers: expect.objectContaining({
          "Content-Type": CONTENT_TYPES.JSON,
        }),
      }),
    );
    expect(result).toEqual(mockApiResponse);
  });

  test("should forward additional configuration (headers, params)", async () => {
    const mockApiResponse: ApiSuccessResponse<any> = { success: true, message: "OK", data: {} };
    const httpClientSpy = vi.spyOn(client, "httpClient").mockResolvedValue(mockApiResponse);
    const config = {
      headers: { Authorization: "Bearer token" },
      query: { dryRun: true },
      timeoutMs: 5000,
    };
    const body = { status: "active" };

    await patch("/resource/1", body, config);

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/resource/1",
        method: "PATCH",
        headers: { ...config.headers, "Content-Type": CONTENT_TYPES.JSON },
        query: config.query,
        timeoutMs: 5000,
      }),
    );
  });

  test("should respect generic type definitions and return wrapped data", async () => {
    interface Item {
      id: number;
      name: string;
      status: string;
    }
    const mockItemData: Item = { id: 1, name: "Original", status: "active" };
    const mockApiResponse: ApiSuccessResponse<Item> = { success: true, message: "Patched", data: mockItemData };

    vi.spyOn(client, "httpClient").mockResolvedValue(mockApiResponse.data);

    const result: Item = await patch<Item>("/items/1", { status: "active" });

    expect(result).toEqual(mockItemData);
    expect(result.status).toBe("active");
  });

  test("should propagate errors from httpClient", async () => {
    vi.spyOn(client, "httpClient").mockRejectedValue(
      new Error("Network Failure"),
    );

    await expect(patch("/fail", {})).rejects.toThrow("Network Failure");
  });

  test("should not allow overriding the PATCH method", async () => {
    const mockApiResponse: ApiSuccessResponse<any> = { success: true, message: "OK", data: {} };
    const httpClientSpy = vi.spyOn(client, "httpClient").mockResolvedValue(mockApiResponse);
    // @ts-expect-error - testing that users can't pass 'method' to patch()
    await patch("/test", {}, { method: "PUT" });

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "PATCH",
      }),
    );
  });
});
