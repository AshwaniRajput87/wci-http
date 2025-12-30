import { describe, it, expect } from "vitest";
import { HTTP_ERROR_KEYS } from "../../src/errors/errorCatalog";

describe("HTTP_ERROR_KEYS", () => {
  it("defines canonical error keys", () => {
    expect(HTTP_ERROR_KEYS.NETWORK_ERROR).toBe("NETWORK_ERROR");
    expect(HTTP_ERROR_KEYS.TIMEOUT).toBe("TIMEOUT");
  });
});
