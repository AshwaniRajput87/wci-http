import { HTTP_ERROR_KEYS } from "./errorCatalog";
import { createErrorCode } from "./createErrorCode";

export function buildHttpErrorCodes(prefix = "WCI") {
  return {
    NETWORK_ERROR: createErrorCode(
      prefix,
      "HTTP",
      HTTP_ERROR_KEYS.NETWORK_ERROR,
    ),
    TIMEOUT: createErrorCode(prefix, "HTTP", HTTP_ERROR_KEYS.TIMEOUT),
  } as const;
}
