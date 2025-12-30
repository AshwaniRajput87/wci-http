/**
 * Logging interceptor for HTTP requests.
 *
 * Used for lightweight observability during development
 * and debugging. Logs request URLs before execution.
 */
import { WciLogger, HttpLogEvent } from "../types/loggingTypes";

export const loggingInterceptor = (
  url: string,
  logger?: WciLogger,
  details?: Partial<HttpLogEvent>,
) => {
 
  if (!logger) return;

  
  const logEvent: HttpLogEvent = {
    level: details?.level || "info",
    category: "http",
    message: details?.message || `HTTP ${details?.method || "Request"} to ${url}`,
    url,
    method: details?.method,
    status: details?.status,
    durationMs: details?.durationMs,
    errorCode: details?.errorCode,
    error: details?.error,
    
  };

  logger.log(logEvent);
};