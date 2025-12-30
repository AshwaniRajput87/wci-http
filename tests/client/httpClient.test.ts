import { describe, it, expect, vi } from "vitest";
import { httpClient } from "../../src/client/httpClient";

describe("httpClient", () => {
  it("uses fetcher and returns json", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ ok: true }),
    });

    const result = await httpClient({
      url: "/test",
      fetcher: mockFetch as any,
    });

    expect(mockFetch).toHaveBeenCalled();
    expect(result).toEqual({ ok: true });
  });

  it("correctly resolves URL and defaults to GET", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });

    await httpClient({
      url: "users",
      baseURL: "https://api.example.com/",
      fetcher: mockFetch as any,
    });

    // Verify the first argument to fetch was the resolved URL
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/users",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });
});
