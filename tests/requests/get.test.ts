import { describe, it, expect, vi } from "vitest";
import * as client from "../../src/client/httpClient";
import { get } from "../../src/requests/get";

describe("get", () => {
  it("calls httpClient", async () => {
    const spy = vi.spyOn(client, "httpClient").mockResolvedValue("ok" as any);

    const result = await get("/test");
    expect(spy).toHaveBeenCalled();
    expect(result).toBe("ok");
  });
});
