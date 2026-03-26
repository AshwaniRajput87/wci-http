import { describe, test, expect, vi, beforeEach } from "vitest";
import { httpClient } from "../../src/client/httpClient";
import { get } from "../../src/requests/get";

describe("get request wrapper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("should call httpClient.request with GET method and correct URL", async () => {
    const httpClientSpy = vi.spyOn(httpClient, "request").mockResolvedValue({});

    await get("/users");

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/users",
        method: "get",
      }),
    );
  });

  test("should forward additional configuration (headers, query)", async () => {
    const httpClientSpy = vi.spyOn(httpClient, "request").mockResolvedValue({});
    const config = {
      headers: { Authorization: "Bearer token" },
      query: { id: "123" },
      timeoutMs: 5000,
    };

    await get("/resource", config);

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/resource",
        method: "get",
        headers: config.headers,
        query: config.query,
        timeoutMs: 5000,
      }),
    );
  });

  test("should respect generic type definitions and return wrapped data", async () => {
    interface User {
      id: number;
      name: string;
    }
    const mockUserData: User = { id: 1, name: "John Doe" };

    vi.spyOn(httpClient, "request").mockResolvedValue(mockUserData);

    const result: User = await get<User>("/user/1");

    expect(result).toEqual(mockUserData);
    expect(result.name).toBe("John Doe");
    expect(result.id).toBe(1);
  });

  test("should propagate errors from httpClient.request", async () => {
    vi.spyOn(httpClient, "request").mockRejectedValue(
      new Error("Network Failure"),
    );

    await expect(get("/fail")).rejects.toThrow("Network Failure");
  });

  test("should not allow overriding the GET method", async () => {
    const httpClientSpy = vi.spyOn(httpClient, "request").mockResolvedValue({});
    // @ts-expect-error - testing that users can't pass 'method' to get()
    await get("/test", { method: "POST" });

    expect(httpClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "get",
      }),
    );
  });
});
