import { buildHttpErrorCodes } from "../errors/errorCodes";
import { createHttpClient } from "../index";

describe("WCI HTTP Client", () => {
  test("should build error codes with default prefix", () => {
    const codes = buildHttpErrorCodes();
    expect(codes.NETWORK_ERROR).toBe("WCI_HTTP_NETWORK_ERROR");
  });

  test("should build error codes with custom prefix", () => {
    const codes = buildHttpErrorCodes("ACME");
    expect(codes.TIMEOUT).toBe("ACME_HTTP_TIMEOUT");
  });

  test("should create http client with errorCodes", () => {
    const client = createHttpClient({ errorPrefix: "TEST" });
    expect(client.errorCodes.NETWORK_ERROR).toBe("TEST_HTTP_NETWORK_ERROR");
    expect(typeof client.get).toBe("function");
  });
});
