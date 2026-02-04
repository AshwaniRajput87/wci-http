import { describe, test, expect, vi, beforeEach } from "vitest";
import { httpClient } from "../../src/client/httpClient";
import { del } from "../../src/requests/delete";

describe("delete request wrapper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("should call httpClient.request with DELETE method and correct URL", async () => {
    const httpClientSpy = vi.spyOn(httpClient, "request").mockResolvedValue(null);

    const result = await del<null>("/items/1");

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/items/1",
        method: "delete",
      }),
    );
    expect(result).toBeNull();
  });

  test("should forward additional configuration (headers, query)", async () => {
    const httpClientSpy = vi.spyOn(httpClient, "request").mockResolvedValue(null);
    const config = {
      headers: { Authorization: "Bearer token" },
      query: { force: true },
    };

    await del("/resource/1", config);

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/resource/1",
        method: "delete",
        headers: config.headers,
        query: config.query,
      }),
    );
  });

  test("should propagate errors from httpClient.request", async () => {
    vi.spyOn(httpClient, "request").mockRejectedValue(
      new Error("Network Failure"),
    );

    await expect(del("/fail")).rejects.toThrow("Network Failure");
  });

  test("should not allow overriding the DELETE method", async () => {
    const httpClientSpy = vi.spyOn(httpClient, "request").mockResolvedValue(null);
    // @ts-expect-error - testing that users can't pass 'method' to del()
    await del("/test", { method: "POST" });

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "delete",
      }),
    );
  });
});
