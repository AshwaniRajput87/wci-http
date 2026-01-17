import { HttpRequest } from "../types/http.types";

export const applyResponseInterceptors = async (
  response: Response,
  request: HttpRequest,
): Promise<Response> => {
  let current = response;

  for (const interceptor of request.responseInterceptors ?? []) {
    current = await Promise.resolve(interceptor(current, request));
  }

  return current;
};
