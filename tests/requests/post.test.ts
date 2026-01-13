import { describe, test, expect, vi, beforeEach } from "vitest";
import * as client from "../../src/client/httpClient";
import { post } from "../../src/requests/post";
import { CONTENT_TYPES } from "../../src/constants/protocol/contentTypes";
import { ApiSuccessResponse } from "../../src/types/success.types";

describe("post request wrapper", () => {
  beforeEach(() => {
    // restoreAllMocks resets the implementation, clearAllMocks resets call counts
    vi.restoreAllMocks();
  });

  test("should call httpClient with POST method and JSON header", async () => {
    const mockApiResponse: ApiSuccessResponse<any> = { success: true, message: "OK", data: {} };
    const spy = vi.spyOn(client, "httpClient").mockResolvedValue(mockApiResponse);
    const body = { id: 1 };

    const result = await post("/test", body);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: "/test",
        body,
        headers: expect.objectContaining({
          "Content-Type": CONTENT_TYPES.JSON,
        }),
      }),
    );
    expect(result).toEqual(mockApiResponse);
  });

  test("should use form-urlencoded header for URLSearchParams", async () => {
    const mockApiResponse: ApiSuccessResponse<any> = { success: true, message: "OK", data: {} };
    const spy = vi.spyOn(client, "httpClient").mockResolvedValue(mockApiResponse);
    const params = new URLSearchParams({ foo: "bar" });

    const result = await post("/form", params);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": CONTENT_TYPES.FORM,
        }),
      }),
    );
    expect(result).toEqual(mockApiResponse);
  });

  test("should NOT set Content-Type for FormData", async () => {
    const mockApiResponse: ApiSuccessResponse<any> = { success: true, message: "OK", data: {} };
    const spy = vi.spyOn(client, "httpClient").mockResolvedValue(mockApiResponse);

    // FormData requires the browser to set the boundary in Content-Type
    await post("/upload", new FormData());

    const callArgs = spy.mock.calls[0][0];

    // Cleanest way to solve ts(18048) and verify the negative case
    expect(callArgs.headers?.["Content-Type"]).toBeUndefined();
  });

  test("should prioritize user-provided Content-Type", async () => {
    const mockApiResponse: ApiSuccessResponse<any> = { success: true, message: "OK", data: {} };
    const spy = vi.spyOn(client, "httpClient").mockResolvedValue(mockApiResponse);
    const customType = "application/vnd.api+json";

    const result = await post(
      "/xml",
      { data: "test" },
      {
        headers: { "Content-Type": customType },
      },
    );

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": customType,
        }),
      }),
    );
    expect(result).toEqual(mockApiResponse);
  });

  test("should enforce POST method even if options try to override it", async () => {
    const mockApiResponse: ApiSuccessResponse<any> = { success: true, message: "OK", data: {} };
    const spy = vi.spyOn(client, "httpClient").mockResolvedValue(mockApiResponse);

    // This specifically tests the property order in your implementation
    const result = await post("/force", {}, { method: "GET" } as any);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(result).toEqual(mockApiResponse);
  });

  test("should handle empty/undefined body without crashing", async () => {
    const mockApiResponse: ApiSuccessResponse<any> = { success: true, message: "OK", data: {} };
    const spy = vi.spyOn(client, "httpClient").mockResolvedValue(mockApiResponse);

    const result = await post("/empty");

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/empty",
        method: "POST",
      }),
    );

    const callArgs = spy.mock.calls[0][0];
    expect(callArgs.headers?.["Content-Type"]).toBeUndefined();
    expect(result).toEqual(mockApiResponse);
  });

  test("should respect generic type definitions and return wrapped data", async () => {
    interface Item {
      id: number;
      value: string;
    }
    const mockItemData: Item = { id: 10, value: "Posted Item" };
    const mockApiResponse: ApiSuccessResponse<Item> = { success: true, message: "Created", data: mockItemData };

    vi.spyOn(client, "httpClient").mockResolvedValue(mockApiResponse.data);

    const result: Item = await post<Item>("/items", { name: "new item" });

    expect(result).toEqual(mockItemData);
    expect(result.value).toBe("Posted Item");
  });
});
