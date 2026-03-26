import { describe, test, expect } from "vitest";
import { handleSuccess } from "../../src/utils/handleSuccess";

describe("handleSuccess", () => {
  test("should return a success response for 204 status with null data", () => {
    const result = handleSuccess(undefined, 204);

    expect(result).toEqual({
      success: true,
      message: "No content",
      data: null,
    });
  });

  test("should return a success response with provided data and message", () => {
    const mockData = { user: { id: 1, name: "Test" } };
    const result = handleSuccess(mockData, 200);

    expect(result).toEqual({
      success: true,
      message: "Request successful",
      data: mockData,
    });
  });

  test("should extract message from response if available", () => {
    const mockResponse = { message: "Item fetched successfully", data: { id: 1 } };
    const result = handleSuccess(mockResponse, 200);

    expect(result).toEqual({
      success: true,
      message: "Item fetched successfully",
      data: { id: 1 },
    });
  });

  test("should extract data from response.data if available", () => {
    const mockResponse = { message: "Item fetched successfully", data: { id: 1 } };
    const result = handleSuccess(mockResponse, 200);

    expect(result).toEqual({
      success: true,
      message: "Item fetched successfully",
      data: { id: 1 },
    });
  });

  test("should include meta from response if available", () => {
    const mockMeta = { total: 10, page: 1 };
    const mockResponse = { data: [], meta: mockMeta };
    const result = handleSuccess(mockResponse, 200);

    expect(result).toEqual({
      success: true,
      message: "Request successful",
      data: [],
      meta: mockMeta,
    });
  });

  test("should handle generic 2xx status codes", () => {
    const mockData = { id: 1 };
    let result = handleSuccess(mockData, 201);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockData);

    result = handleSuccess(mockData, 202);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockData);
  });
});
