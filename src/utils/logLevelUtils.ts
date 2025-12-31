

import type { LogLevel } from "../types/loggingTypes";

export const getLogLevelFromStatus = (status: number): LogLevel => {
  if (status >= 500) return "error";
  if (status >= 400) return "warn";
  return "info";
};
