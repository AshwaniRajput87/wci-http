import { describe, test, expect, vi, beforeEach } from "vitest";
import { httpClient } from "../../src/client/httpClient";
import { optionsReq } from "../../src/requests/options";

describe("options request wrapper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("should call httpClient.request with OPTIONS method and correct URL", async () => {
    const httpClientSpy = vi.spyOn(httpClient, "request").mockResolvedValue(null);

    const result = await optionsReq("/items");

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/items",
        method: "options",
      }),
    );
    expect(result).toBeNull();
  });

  test("should forward additional configuration (headers, query)", async () => {
    const httpClientSpy = vi.spyOn(httpClient, "request").mockResolvedValue(null);
    const config = {
      headers: { "Access-Control-Request-Headers": "Content-Type" },
      query: { detailed: true },
    };

    await optionsReq("/resource", config);

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/resource",
        method: "options",
        headers: config.headers,
        query: config.query,
      }),
    );
  });

  test("should propagate errors from httpClient.request", async () => {
    vi.spyOn(httpClient, "request").mockRejectedValue(
      new Error("Network Failure"),
    );

    await expect(optionsReq("/fail")).rejects.toThrow("Network Failure");
  });

  test("should not allow overriding the OPTIONS method", async () => {
    const httpClientSpy = vi.spyOn(httpClient, "request").mockResolvedValue(null);
    // @ts-expect-error - testing that users can't pass 'method' to optionsReq()
    await optionsReq("/test", { method: "POST" });

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "options",
      }),
    );
  });
});
