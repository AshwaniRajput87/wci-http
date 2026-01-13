import { ApiSuccessResponse } from "../types/success.types";

export function handleSuccess<T>(
  response: any,
  status: number
): ApiSuccessResponse<T> {
  if (status === 204) {
    return {
      success: true,
      message: "No content",
      data: null as T,
    };
  }

  return {
    success: true,
    message: response?.message ?? "Request successful",
    data: response?.data ?? response,
    meta: response?.meta,
  };
}
