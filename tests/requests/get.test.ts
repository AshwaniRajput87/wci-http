import { describe, test, expect, vi, beforeEach } from "vitest";
import * as client from "../../src/client/httpClient";
import { get } from "../../src/requests/get";

describe("get request wrapper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("should call httpClient with GET method and correct URL", async () => {
    const httpClientSpy = vi
      .spyOn(client, "httpClient")
      .mockResolvedValue({ success: true });

    const result = await get("/users");

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/users",
        method: "GET",
      }),
    );
    expect(result).toEqual({ success: true });
  });

  test("should forward additional configuration (headers, params)", async () => {
    const httpClientSpy = vi.spyOn(client, "httpClient").mockResolvedValue({});
    const config = {
      headers: { Authorization: "Bearer token" },
      params: { id: "123" },
      timeout: 5000,
    };

    await get("/resource", config);

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/resource",
        method: "GET",
        headers: config.headers,
        params: config.params,
        timeout: 5000,
      }),
    );
  });

  test("should respect generic type definitions", async () => {
    interface User {
      id: number;
      name: string;
    }
    const mockUser: User = { id: 1, name: "John Doe" };

    vi.spyOn(client, "httpClient").mockResolvedValue(mockUser);

    const result = await get<User>("/user/1");

    expect(result.name).toBe("John Doe");
    expect(result.id).toBe(1);
  });

  test("should propagate errors from httpClient", async () => {
    vi.spyOn(client, "httpClient").mockRejectedValue(
      new Error("Network Failure"),
    );

    await expect(get("/fail")).rejects.toThrow("Network Failure");
  });

  test("should not allow overriding the GET method", async () => {
    const httpClientSpy = vi.spyOn(client, "httpClient").mockResolvedValue({});
    // @ts-expect-error - testing that users can't pass 'method' to get()
    await get("/test", { method: "POST" });

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
      }),
    );
  });
});
