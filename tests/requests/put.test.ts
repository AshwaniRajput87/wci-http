import { describe, test, expect, vi, beforeEach } from "vitest";
import * as client from "../../src/client/httpClient";
import { put } from "../../src/requests/put";
import { ApiSuccessResponse } from "../../src/types/success.types";
import { CONTENT_TYPES } from "../../src/constants/protocol/contentTypes";

describe("put request wrapper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("should call httpClient with PUT method and JSON header", async () => {
    const mockApiResponse: ApiSuccessResponse<any> = { success: true, message: "OK", data: {} };
    const httpClientSpy = vi.spyOn(client, "httpClient").mockResolvedValue(mockApiResponse);
    const body = { id: 1, name: "Updated" };

    const result = await put("/items/1", body);

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/items/1",
        method: "PUT",
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
      query: { version: "2" },
      timeoutMs: 5000,
    };
    const body = { name: "test" };

    await put("/resource/1", body, config);

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/resource/1",
        method: "PUT",
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
    }
    const mockItemData: Item = { id: 1, name: "Updated Item" };
    const mockApiResponse: ApiSuccessResponse<Item> = { success: true, message: "Updated", data: mockItemData };

    vi.spyOn(client, "httpClient").mockResolvedValue(mockApiResponse.data);

    const result: Item = await put<Item>("/items/1", { name: "new name" });

    expect(result).toEqual(mockItemData);
    expect(result.name).toBe("Updated Item");
  });

  test("should propagate errors from httpClient", async () => {
    vi.spyOn(client, "httpClient").mockRejectedValue(
      new Error("Network Failure"),
    );

    await expect(put("/fail", {})).rejects.toThrow("Network Failure");
  });

  test("should not allow overriding the PUT method", async () => {
    const mockApiResponse: ApiSuccessResponse<any> = { success: true, message: "OK", data: {} };
    const httpClientSpy = vi.spyOn(client, "httpClient").mockResolvedValue(mockApiResponse);
    // @ts-expect-error - testing that users can't pass 'method' to put()
    await put("/test", {}, { method: "GET" });

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "PUT",
      }),
    );
  });
});
