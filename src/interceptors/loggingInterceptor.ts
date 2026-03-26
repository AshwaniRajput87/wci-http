/**
 * Logging interceptors for HTTP requests and responses.
 *
 * Provides a factory to create request and response interceptors
 * that log various stages of the HTTP lifecycle.
 */
import {
  WciLogger,
  HttpLogEvent,
  HttpLogEventType,
  HttpRequest,
  RequestInterceptor,
  ResponseInterceptor,
} from "../types/http.types";
import { LogLevel } from "../types/loggingTypes";
import { getLogLevelFromStatus } from "../utils/logLevelUtils";
import { WciHttpError } from "../errors/WciHttpError";
// Internal helper to create log events
const createLogEvent = (
  request: HttpRequest,
  type: HttpLogEventType, // New parameter for event type
  level: LogLevel, // Corrected type
  message: string,
  details?: Partial<Omit<HttpLogEvent, 'type' | 'level' | 'category' | 'message'>>, // Specific details for partial
): HttpLogEvent => ({
  type, // Include the type
  level,
  category: "http",
  message: message,
  url: request.url,
  method: request.method,
  ...details,
});

// Utility to perform logging with duration
const performLogging = (
  logger: WciLogger,
  request: HttpRequest,
  type: HttpLogEventType, // New parameter for event type
  level: LogLevel, // Corrected type
  message: string,
  startTime: number,
  status?: number,
  error?: unknown,
  errorCode?: string,
) => {
  const durationMs = Date.now() - startTime;
  logger.log(
    createLogEvent(request, type, level, message, { // Updated call to createLogEvent
      status,
      durationMs,
      error,
      errorCode,
    }),
  );
};

export const createLoggingInterceptors = (logger: WciLogger) => {
  // Store start times for duration calculation
  const requestStartTimes = new Map<HttpRequest, number>();

  const requestInterceptor: RequestInterceptor = (request: HttpRequest) => {
    requestStartTimes.set(request, Date.now());
    logger.log(
      createLogEvent(request, HttpLogEventType.REQUEST_START, LogLevel.INFO, `REQUEST → ${request.method} ${request.url}`),
    );
    // Log request data if available (careful with sensitive info)
    if (request.body && typeof request.body === 'string') { // Assuming JSON body for simplicity here
      logger.log(
        createLogEvent(request, HttpLogEventType.REQUEST_START, LogLevel.DEBUG, `REQUEST BODY: ${request.body}`, { category: "http" }),
      );
    }
    return request;
  };

  const responseInterceptor: ResponseInterceptor = (response: Response, request: HttpRequest) => {
    const startTime = requestStartTimes.get(request) || Date.now();
    requestStartTimes.delete(request); // Clean up

    const level = getLogLevelFromStatus(response.status);
    performLogging(logger, request, HttpLogEventType.RESPONSE_SUCCESS, level, `RESPONSE ← ${request.method} ${request.url} [${response.status}]`, startTime, response.status);

    // Clone response if reading body, as it's a stream
    if (response.status !== 204 && response.headers.get("content-length") !== "0") {
      response.clone().json().then((data: any) => {
        logger.log(
          createLogEvent(request, HttpLogEventType.RESPONSE_SUCCESS, LogLevel.DEBUG, `RESPONSE DATA: ${JSON.stringify(data)}`, { category: "http", status: response.status }),
        );
      }).catch((err: any) => {
        logger.log(
          createLogEvent(request, HttpLogEventType.RESPONSE_SUCCESS, LogLevel.WARN, `Failed to log response body: ${err.message}`, { category: "http", status: response.status, error: err }),
        );
      });
    }

    return response;
  };

  const errorInterceptor = (error: WciHttpError, request: HttpRequest) => {
    const startTime = requestStartTimes.get(request) || Date.now();
    requestStartTimes.delete(request); // Clean up

    performLogging(logger, request, HttpLogEventType.REQUEST_ERROR, LogLevel.ERROR, `ERROR ← ${request.method} ${request.url} [${error.status || 'N/A'}] - ${error.message || error}`, startTime, error.status, error, error.code);
    throw error; // Re-throw the error so it continues down the chain
  };

  return {
    requestInterceptor,
    responseInterceptor,
    errorInterceptor,
  };
};
