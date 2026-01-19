import { describe, it, expect } from "vitest";
import { createHttpErrorCodes } from "../src/errors/httpErrorCodes";

describe("createHttpErrorCodes", () => {
  it("creates client with errorCodes", () => {
    const errorCodes = createHttpErrorCodes("TEST");
    expect(errorCodes.NETWORK_ERROR).toBe("TEST_HTTP_NETWORK_ERROR");
  });
});
