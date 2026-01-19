import { describe, test, expect } from "vitest";
import { serializeRequestBody } from "../../src/utils/bodySerializerzUtils";
import { CONTENT_TYPES } from "../../src/constants/protocol/contentTypes";

describe("serializeRequestBody", () => {
  test("should return empty headers if body is undefined", () => {
    const { body, headers } = serializeRequestBody({ url: "" });
    expect(body).toBeUndefined();
    expect(headers).toEqual({});
  });

  test("should let browser handle FormData and not set Content-Type", () => {
    const formData = new FormData();
    formData.append("key", "value");
    const { body, headers } = serializeRequestBody({ body: formData });
    expect(body).toBe(formData);
    expect(headers).toEqual({});
  });

  test("should not override existing Content-Type for FormData", () => {
    const formData = new FormData();
    const existingHeaders = { "Content-Type": "custom/form-data" };
    const { body, headers } = serializeRequestBody({
      body: formData,
      headers: existingHeaders,
    });
    expect(body).toBe(formData);
    expect(headers).toEqual({}); // Serializer should return empty headers if it didn't change them
  });

  test("should set Content-Type for URLSearchParams if not present", () => {
    const params = new URLSearchParams();
    params.append("key", "value");
    const { body, headers } = serializeRequestBody({ body: params });
    expect(body).toBe(params);
    expect(headers).toEqual({ "Content-Type": CONTENT_TYPES.FORM });
  });

  test("should not override Content-Type for URLSearchParams", () => {
    const params = new URLSearchParams();
    const existingHeaders = { "Content-Type": "custom/url-encoded" };
    const { body, headers } = serializeRequestBody({
      body: params,
      headers: existingHeaders,
    });
    expect(body).toBe(params);
    expect(headers).toEqual({});
  });

  test("should set Content-Type for Blob if not present", () => {
    const blob = new Blob(["content"]);
    const { body, headers } = serializeRequestBody({ body: blob });
    expect(body).toBe(blob);
    expect(headers).toEqual({ "Content-Type": CONTENT_TYPES.OCTET_STREAM });
  });

  test("should set Content-Type for string if not present", () => {
    const { body, headers } = serializeRequestBody({ body: "a string" });
    expect(body).toBe("a string");
    expect(headers).toEqual({ "Content-Type": CONTENT_TYPES.TEXT });
  });

  test("should stringify object and set Content-Type to JSON", () => {
    const data = { key: "value" };
    const { body, headers } = serializeRequestBody({ body: data });
    expect(body).toBe(JSON.stringify(data));
    expect(headers).toEqual({ "Content-Type": CONTENT_TYPES.JSON });
  });

  test("should not override Content-Type for object", () => {
    const data = { key: "value" };
    const existingHeaders = { "Content-Type": "application/vnd.api+json" };
    const { body, headers } = serializeRequestBody({
      body: data,
      headers: existingHeaders,
    });
    expect(body).toBe(JSON.stringify(data));
    expect(headers).toEqual({});
  });

  test("should handle case-insensitive Content-Type header", () => {
    const params = new URLSearchParams();
    const existingHeaders = { "content-type": "custom/url-encoded" };
    const { body, headers } = serializeRequestBody({
      body: params,
      headers: existingHeaders,
    });
    expect(body).toBe(params);
    expect(headers).toEqual({});
  });
});
