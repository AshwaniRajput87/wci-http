import type { RequestInterceptor } from "../types/http.types";

export const createAuthInterceptor = (
  getToken: () => string | undefined,
): RequestInterceptor => {
  return async (request) => {
    const token = getToken();

    if (!token) return request;

    return {
      ...request,
      headers: {
        ...request.headers,
        Authorization: `Bearer ${token}`,
      },
    };
  };
};
