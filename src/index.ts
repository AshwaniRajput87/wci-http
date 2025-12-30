import { createHttpErrorCodes } from "./errors/httpErrorCodes";
import { get } from "./requests/get";
import { post } from "./requests/post";

export const createHttpClient = (config?: { errorPrefix?: string }) => {
  const errorCodes = createHttpErrorCodes(config?.errorPrefix ?? "WCI");

  return {
    get,
    post,
    errorCodes,
  };
};
