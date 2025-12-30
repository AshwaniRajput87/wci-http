import { describe, it, expect } from "vitest";
import { resolveUrl } from "../../src/utils/urlResolverUtils";

describe("resolveUrl", () => {
  it("keeps absolute URL intact", () => {
    expect(resolveUrl("x", "https://api.com")).toBe("https://api.com");
  });

  it("resolves relative URL with baseURL", () => {
    expect(resolveUrl("https://api.com", "/users")).toBe(
      "https://api.com/users",
    );
  });

  it("returns relative URL if baseURL missing", () => {
    expect(resolveUrl(undefined, "/users")).toBe("/users");
  });
});
