import { describe, test, expect } from "vitest";
import { parseError } from "../../src/errors/parseError";

describe("parseError", () => {
  test("should parse a standard Error object", () => {
    const error = new Error("Network connection failed");
    const result = parseError(error);

    expect(result.message).toBe("Network connection failed");
    expect(result.original).toBe(error);
  });

  test("should extract the 'cause' property if present in Error object", () => {
    const error = new Error("Request failed") as any;
    error.cause = { status: 500 };

    const result = parseError(error);
    expect(result.cause).toEqual({ status: 500 });
  });

  test("should handle raw string errors", () => {
    const result = parseError("Unauthorized access");
    expect(result.message).toBe("Unauthorized access");
    expect(result.original).toBe("Unauthorized access");
  });

  test("should handle numeric error codes", () => {
    const result = parseError(404);
    expect(result.message).toBe("Error code: 404");
  });

  test("should extract message from plain objects with a message property", () => {
    const errorObj = { message: "Internal server error", cause: "DB Down" };
    const result = parseError(errorObj);

    expect(result.message).toBe("Internal server error");
    expect(result.cause).toBe("DB Down");
  });

  test("should return 'Unknown error occurred' for null or undefined", () => {
    expect(parseError(null).message).toBe("Unknown error occurred");
    expect(parseError(undefined).message).toBe("Unknown error occurred");
  });

  test("should return 'Unknown error occurred' for empty objects or empty strings", () => {
    expect(parseError({}).message).toBe("Unknown error occurred");
    expect(parseError("  ").message).toBe("Unknown error occurred");
  });
});
