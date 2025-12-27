/**
 * Logging interceptor for HTTP requests.
 *
 * Used for lightweight observability during development
 * and debugging. Logs request URLs before execution.
 */
export const loggingInterceptor = (url: string): void => {
  console.log('[HTTP]', url);
};
