import { describe, it, expect } from "vitest";
import { WciHttpError } from "../../src/errors/WciHttpError";

describe("WciHttpError", () => {
  it("creates error correctly", () => {
    const err = new WciHttpError({
      code: "WCI_HTTP_TIMEOUT",
      message: "Timeout",
      status: 408,
    });

    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe("WCI_HTTP_TIMEOUT");
    expect(err.status).toBe(408);
  });
});
