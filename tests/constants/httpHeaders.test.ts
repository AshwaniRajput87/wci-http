import { describe, it, expect } from "vitest";
import { HTTP_HEADERS } from "../../src/constants/httpHeaders";

describe("HTTP_HEADERS", () => {
  it("exposes standard HTTP header names", () => {
    expect(HTTP_HEADERS.CONTENT_TYPE).toBe("Content-Type");
    expect(HTTP_HEADERS.AUTHORIZATION).toBe("Authorization");
  });
});
