import { describe, it, expect } from "vitest";
import { parseError } from "../../src/errors/parseError";

describe("parseError", () => {
  it("parses Error", () => {
    const err = new Error("fail");
    const parsed = parseError(err);
    expect(parsed.message).toBe("fail");
  });

  it("parses string", () => {
    const parsed = parseError("oops");
    expect(parsed.message).toBe("oops");
  });

  it("handles unknown", () => {
    const parsed = parseError(123);
    expect(parsed.message).toBe("Unknown error");
  });
});
