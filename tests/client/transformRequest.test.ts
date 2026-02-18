import { describe, test, expect, vi, beforeEach } from "vitest";
import { httpClient } from "../../src/client/httpClient";
import type { HttpClientFetcher } from "../../src/types/http.types";

describe("transformRequest", () => {
  let mockFetch: HttpClientFetcher & { mockResolvedValueOnce: any; mockClear: any };

  const jsonResponse = (body: any) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  beforeEach(() => {
    mockFetch = vi.fn() as unknown as HttpClientFetcher & {
      mockResolvedValueOnce: any;
      mockClear: any;
    };
    vi.clearAllMocks();
  });

  test("calls transformRequest with (data, headers) and applies header mutations", async () => {
    (mockFetch as any).mockResolvedValueOnce(jsonResponse({ ok: true }));

    const transformer = vi.fn((data: any, headers: Record<string, any>) => {
      headers["X-Transformed"] = "yes";
      return { ...data, added: true };
    });

    await httpClient({
      url: "/test",
      method: "post",
      data: { foo: "bar" },
      headers: { Initial: "one" },
      fetcher: mockFetch,
      transformRequest: transformer,
    });

    expect(transformer).toHaveBeenCalledTimes(1);
    expect(transformer).toHaveBeenCalledWith(
      { foo: "bar" },
      expect.objectContaining({ Initial: "one" })
    );

    const fetchInit = (mockFetch as any).mock.calls[0][1];
    expect(fetchInit.body).toBe(JSON.stringify({ foo: "bar", added: true }));
    expect(fetchInit.headers).toMatchObject({
      Initial: "one",
      "X-Transformed": "yes",
      "Content-Type": "application/json",
    });
  });

  test("applies multiple transformRequest functions in order", async () => {
    (mockFetch as any).mockResolvedValueOnce(jsonResponse({ ok: true }));

    const first = vi.fn((data: any) => ({ ...data, steps: ["one"] }));
    const second = vi.fn((data: any) => ({
      ...data,
      steps: [...(data.steps || []), "two"],
    }));

    await httpClient({
      url: "/multi",
      method: "post",
      data: { initial: true },
      fetcher: mockFetch,
      transformRequest: [first, second],
    });

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith(
      expect.objectContaining({ steps: ["one"] })
    );

    const fetchInit = (mockFetch as any).mock.calls[0][1];
    expect(fetchInit.body).toBe(
      JSON.stringify({ initial: true, steps: ["one", "two"] })
    );
  });

  test("preserves existing behavior when transformRequest is absent", async () => {
    (mockFetch as any).mockResolvedValueOnce(jsonResponse({ ok: true }));

    await httpClient({
      url: "/no-transform",
      method: "post",
      data: { baseline: true },
      fetcher: mockFetch,
    });

    const fetchInit = (mockFetch as any).mock.calls[0][1];
    expect(fetchInit.body).toBe(JSON.stringify({ baseline: true }));
    expect(fetchInit.headers).toMatchObject({
      "Content-Type": "application/json",
    });
  });

  test("sets urlencoded content-type when transformer returns URLSearchParams", async () => {
    (mockFetch as any).mockResolvedValueOnce(jsonResponse({ ok: true }));

    await httpClient({
      url: "/form",
      method: "post",
      data: { a: "1", b: "2" },
      fetcher: mockFetch,
      transformRequest: (_data: any) => {
        const params = new URLSearchParams();
        params.set("a", "1");
        params.set("b", "2");
        return params;
      },
    });

    const fetchInit = (mockFetch as any).mock.calls[0][1];
    expect(fetchInit.body).toBeInstanceOf(URLSearchParams);
    expect(fetchInit.headers).toMatchObject({
      "Content-Type": "application/x-www-form-urlencoded",
    });
  });

  test("does not stringify FormData returned by transformRequest", async () => {
    (mockFetch as any).mockResolvedValueOnce(jsonResponse({ ok: true }));

    const form = new FormData();
    form.append("name", "alice");

    await httpClient({
      url: "/upload",
      method: "post",
      data: { placeholder: true },
      fetcher: mockFetch,
      transformRequest: () => form,
    });

    const fetchInit = (mockFetch as any).mock.calls[0][1];
    expect(fetchInit.body).toBe(form);
    // Content-Type must be set by fetch/undici for multipart boundaries
    expect(Object.keys(fetchInit.headers)).not.toContain("Content-Type");
    expect(Object.keys(fetchInit.headers)).not.toContain("content-type");
  });

  test("respects user-provided Content-Type when FormData is used", async () => {
    (mockFetch as any).mockResolvedValueOnce(jsonResponse({ ok: true }));

    const form = new FormData();
    form.append("file", new Blob(["hi"]), "hi.txt");

    await httpClient({
      url: "/upload-custom",
      method: "post",
      data: form,
      headers: { "Content-Type": "custom/type" },
      fetcher: mockFetch,
    });

    const fetchInit = (mockFetch as any).mock.calls[0][1];
    // Body should not be stringified and custom header must persist
    expect(fetchInit.body).toBeDefined();
    expect(typeof fetchInit.body).not.toBe("string");
    expect(fetchInit.headers).toMatchObject({ "Content-Type": "custom/type" });
  });
});
