import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { WciHttp } from "../../src/client/WciHttp";
import * as getRequestModule from "../../src/requests/get";
import * as postRequestModule from "../../src/requests/post";

vi.mock("../../src/requests/get");
vi.mock("../../src/requests/post");

const get = vi.spyOn(getRequestModule, 'get');
const post = vi.spyOn(postRequestModule, 'post');

describe("WciHttp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("create() should return a new instance that uses merged config", async () => {
    const baseConfig = { baseURL: "https://api.example.com", headers: { "X-Base": "true" } };
    const instance = new WciHttp(baseConfig);
    const newConfig = { headers: { "X-New": "true" } };
    const newInstance = instance.create(newConfig);

    await newInstance.get("/test");

    const expectedConfig = {
      baseURL: "https://api.example.com",
      headers: { "X-Base": "true", "X-New": "true" },
    };

    expect(get).toHaveBeenCalledWith("/test", {}, expect.objectContaining(expectedConfig));
  });

  test("get() should call getRequest with instance config", async () => {
    const baseConfig = { baseURL: "https://api.example.com" };
    const instance = new WciHttp(baseConfig);

    await instance.get("/test");

    expect(get).toHaveBeenCalledWith("/test", {}, expect.objectContaining(baseConfig));
  });

  test("post() should call postRequest with instance config", async () => {
    const baseConfig = { baseURL: "https://api.example.com" };
    const instance = new WciHttp(baseConfig);
    const postData = { foo: "bar" };

    await instance.post("/test", postData);

    expect(post).toHaveBeenCalledWith("/test", postData, {}, expect.objectContaining(baseConfig));
  });

  describe("baseURL resolution", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    test("should use baseURL from config if provided", async () => {
      vi.stubEnv('WCI_HTTP_BASE_URL', 'https://env-url.com');
      const instance = new WciHttp({ baseURL: "https://config-url.com" });
      await instance.get("/test");
      expect(get).toHaveBeenCalledWith("/test", {}, expect.objectContaining({ baseURL: "https://config-url.com" }));
    });

    test("should use baseURL from environment variable if not in config", async () => {
      vi.stubEnv('WCI_HTTP_BASE_URL', 'https://env-url.com');
      const instance = new WciHttp({});
      await instance.get("/test");
      expect(get).toHaveBeenCalledWith("/test", {}, expect.objectContaining({ baseURL: "https://env-url.com" }));
    });

    test("should have undefined baseURL if not in config or env", async () => {
      // Ensure env var is not set
      vi.stubEnv('WCI_HTTP_BASE_URL', undefined);
      const instance = new WciHttp({});
      await instance.get("/test");
      expect(get).toHaveBeenCalledWith("/test", {}, expect.objectContaining({ baseURL: undefined }));
    });
  });
});
