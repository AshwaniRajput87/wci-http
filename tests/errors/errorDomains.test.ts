import { describe, it, expect } from "vitest";
import { ERROR_DOMAINS } from "../../src/errors/errorDomains";

describe("ERROR_DOMAINS", () => {
  it("defines HTTP domain", () => {
    expect(ERROR_DOMAINS.HTTP).toBe("HTTP");
  });
});
