
export type SuccessStatusCode =
  | 200
  | 201
  | 202
  | 204;

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, any>;
}

export type SuccessHandler<T> = (
  response: unknown,
  status: SuccessStatusCode
) => ApiSuccessResponse<T>;
