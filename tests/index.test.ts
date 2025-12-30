import { describe, it, expect } from "vitest";
import { createHttpClient } from "../src";

describe("createHttpClient", () => {
  it("creates client with errorCodes", () => {
    const client = createHttpClient({ errorPrefix: "TEST" });
    expect(client.errorCodes.NETWORK_ERROR).toBe("TEST_HTTP_NETWORK_ERROR");
  });
});
