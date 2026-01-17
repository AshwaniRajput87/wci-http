import { HttpRequest } from "../types/http.types";

export const applyRequestInterceptors = async (
  request: HttpRequest,
): Promise<HttpRequest> => {
  let current = request;

  for (const interceptor of request.requestInterceptors ?? []) {
    current = await Promise.resolve(interceptor(current));
  }

  return current;
};
