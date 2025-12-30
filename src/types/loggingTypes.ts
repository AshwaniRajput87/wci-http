export type LogLevel = "debug" | "info" | "warn" | "error";

export interface HttpLogEvent {
  level: LogLevel;
  category: "http";
  message: string;
  url: string;
  method?: string;
  status?: number;
  durationMs?: number;
  errorCode?: string;
  error?: unknown;
}

export interface WciLogger {
  log: (event: HttpLogEvent) => void;
}
