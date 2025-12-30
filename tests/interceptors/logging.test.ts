import { describe, it, expect, vi } from "vitest";
import { loggingInterceptor } from "../../src/interceptors/logging";

describe("loggingInterceptor", () => {
  it("logs url", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    loggingInterceptor("/test");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
