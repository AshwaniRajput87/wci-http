import { LogLevel } from "../types/loggingTypes";

export const getLogLevelFromStatus = (status: number): LogLevel => {
  if (status >= 500) return LogLevel.ERROR;
  if (status >= 400) return LogLevel.WARN;
  return LogLevel.INFO;
};
