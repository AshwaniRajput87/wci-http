import { describe, test, expect, vi, beforeEach } from "vitest";
import * as client from "../../src/client/httpClient";
import { post } from "../../src/requests/post";
import { CONTENT_TYPES } from "../../src/constants/protocol/contentTypes";

describe("post request wrapper", () => {
  beforeEach(() => {
    // restoreAllMocks resets the implementation, clearAllMocks resets call counts
    vi.restoreAllMocks();
  });

  test("should call httpClient with POST method and JSON header", async () => {
    const spy = vi.spyOn(client, "httpClient").mockResolvedValue("ok" as any);
    const body = { id: 1 };

    await post("/test", body);

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
  });

  test("should use form-urlencoded header for URLSearchParams", async () => {
    const spy = vi.spyOn(client, "httpClient").mockResolvedValue("ok" as any);
    const params = new URLSearchParams({ foo: "bar" });

    await post("/form", params);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": CONTENT_TYPES.FORM,
        }),
      }),
    );
  });

  test("should NOT set Content-Type for FormData", async () => {
    const spy = vi.spyOn(client, "httpClient").mockResolvedValue("ok" as any);

    // FormData requires the browser to set the boundary in Content-Type
    await post("/upload", new FormData());

    const callArgs = spy.mock.calls[0][0];

    // Cleanest way to solve ts(18048) and verify the negative case
    expect(callArgs.headers?.["Content-Type"]).toBeUndefined();
  });

  test("should prioritize user-provided Content-Type", async () => {
    const spy = vi.spyOn(client, "httpClient").mockResolvedValue("ok" as any);
    const customType = "application/vnd.api+json";

    await post(
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
  });

  test("should enforce POST method even if options try to override it", async () => {
    const spy = vi.spyOn(client, "httpClient").mockResolvedValue("ok" as any);

    // This specifically tests the property order in your implementation
    await post("/force", {}, { method: "GET" } as any);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  test("should handle empty/undefined body without crashing", async () => {
    const spy = vi.spyOn(client, "httpClient").mockResolvedValue("ok" as any);

    await post("/empty");

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/empty",
        method: "POST",
      }),
    );

    const callArgs = spy.mock.calls[0][0];
    expect(callArgs.headers?.["Content-Type"]).toBeUndefined();
  });
});
