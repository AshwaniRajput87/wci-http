import { WciHttpError } from "../errors/WciHttpError";
import { createHttpErrorCodes } from "../errors/httpErrorCodes";

const httpErrorCodes = createHttpErrorCodes();

export const parseResponseBody = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json") || contentType.endsWith("+json")) {
    try {
      return await response.json();
    } catch (error) {
      throw new WciHttpError({
        code: httpErrorCodes.INVALID_JSON,
        message: "Failed to parse JSON response",
        cause: error,
        url: response.url,
      });
    }
  }

  if (contentType.startsWith("text/")) {
    try {
      return await response.text();
    } catch (error) {
      throw new WciHttpError({
        code: httpErrorCodes.INVALID_RESPONSE,
        message: "Failed to parse text response",
        cause: error,
        url: response.url,
      });
    }
  }

  try {
    return await response.arrayBuffer();
  } catch (error) {
    throw new WciHttpError({
      code: httpErrorCodes.INVALID_RESPONSE,
      message: "Failed to parse binary response",
      cause: error,
      url: response.url,
    });
  }
};
