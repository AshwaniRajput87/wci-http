import { buildHttpErrorCodes } from "./errors/errorCodes";
import { get } from "./requests/get";
import { post } from "./requests/post";

export function createHttpClient(config?: { errorPrefix?: string }) {
  const errorCodes = buildHttpErrorCodes(config?.errorPrefix);

  return {
    get,
    post,
    errorCodes,
  };
}
