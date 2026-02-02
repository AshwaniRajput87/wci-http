import { describe, test, expect, vi, beforeEach } from "vitest";
import { httpClient } from "../../src/client/httpClient";
import { patch } from "../../src/requests/patch";
import { CONTENT_TYPES } from "../../src/constants/protocol/contentTypes";

describe("patch request wrapper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("should call httpClient.request with PATCH method and JSON header", async () => {
    const httpClientSpy = vi.spyOn(httpClient, "request").mockResolvedValue({});
    const body = { name: "Partial Update" };

    await patch("/items/1", body);

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/items/1",
        method: "patch",
        data: body,
      }),
    );
  });

  test("should forward additional configuration (headers, query)", async () => {
    const httpClientSpy = vi.spyOn(httpClient, "request").mockResolvedValue({});
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
        method: "patch",
        data: body,
        headers: config.headers,
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

    vi.spyOn(httpClient, "request").mockResolvedValue(mockItemData);

    const result: Item = await patch<Item>("/items/1", { status: "active" });

    expect(result).toEqual(mockItemData);
    expect(result.status).toBe("active");
  });

  test("should propagate errors from httpClient.request", async () => {
    vi.spyOn(httpClient, "request").mockRejectedValue(
      new Error("Network Failure"),
    );

    await expect(patch("/fail", {})).rejects.toThrow("Network Failure");
  });

  test("should not allow overriding the PATCH method", async () => {
    const httpClientSpy = vi.spyOn(httpClient, "request").mockResolvedValue({});
    // @ts-expect-error - testing that users can't pass 'method' to patch()
    await patch("/test", {}, { method: "PUT" });

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "patch",
      }),
    );
  });
});
