import { describe, test, expect } from "vitest";
import { ERROR_DOMAINS } from "../../src/errors/errorDomains";

describe("ERROR_DOMAINS", () => {
  test("should define stable domain strings", () => {
    expect(ERROR_DOMAINS.HTTP).toBe("HTTP");
    expect(ERROR_DOMAINS.AUTH).toBe("AUTH");
    expect(ERROR_DOMAINS.SYSTEM).toBe("SYSTEM");
  });

  test("should be immutable", () => {
    expect(Object.isFrozen(ERROR_DOMAINS)).toBe(true);
  });
});
