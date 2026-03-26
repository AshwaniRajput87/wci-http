import { HTTP_METHODS } from "../constants/httpMethods";
import type { HttpMethod } from "../types/http.types";
import type { HttpRequest } from "../types/http.types";

export const executeFetch = async (
  fetcher: typeof fetch,
  request: HttpRequest,
  body: BodyInit | undefined,
  signal?: AbortSignal,
): Promise<Response> => {
  return fetcher(request.url!, {
    ...request,
    method: (request.method || HTTP_METHODS.GET).toUpperCase() as HttpMethod,
    body,
    signal,
  });
};
