
import { WciHttpError } from '../errors/WciHttpError';
import { HTTP_ERROR_KEYS } from '../errors/errorCatalog';

const errorCodeToTypeMap: Record<string, string> = {
  [HTTP_ERROR_KEYS.NETWORK_ERROR]: 'NETWORK_ERROR',
  [HTTP_ERROR_KEYS.TIMEOUT]: 'TIMEOUT',
  [HTTP_ERROR_KEYS.ABORTED]: 'ABORTED',
  [HTTP_ERROR_KEYS.BAD_REQUEST]: 'BAD_REQUEST',
  [HTTP_ERROR_KEYS.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HTTP_ERROR_KEYS.FORBIDDEN]: 'FORBIDDEN',
  [HTTP_ERROR_KEYS.NOT_FOUND]: 'NOT_FOUND',
  [HTTP_ERROR_KEYS.CONFLICT]: 'CONFLICT',
  [HTTP_ERROR_KEYS.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
  [HTTP_ERROR_KEYS.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
  [HTTP_ERROR_KEYS.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
  [HTTP_ERROR_KEYS.BAD_GATEWAY]: 'BAD_GATEWAY',
  [HTTP_ERROR_KEYS.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
  [HTTP_ERROR_KEYS.GATEWAY_TIMEOUT]: 'GATEWAY_TIMEOUT',
  [HTTP_ERROR_KEYS.INVALID_JSON]: 'INVALID_JSON',
  [HTTP_ERROR_KEYS.INVALID_RESPONSE]: 'INVALID_RESPONSE',
  [HTTP_ERROR_KEYS.UNKNOWN_ERROR]: 'UNKNOWN_ERROR',
  'HTTP_404': 'NOT_FOUND',
};

const getErrorType = (errorCode: string): string => {
  return errorCodeToTypeMap[errorCode] || errorCode;
};

export const logHttpError = (error: WciHttpError): void => {
  console.error('── HTTP ERROR ─────────────────────────');
  console.error(`Type      : ${getErrorType(error.code)}`);
  console.error(`Code      : ${error.code}`);
  console.error(`Message   : ${error.message}`);
  if (error.method) {
    console.error(`Method    : ${error.method}`);
  }
  if (error.url) {
    console.error(`URL       : ${error.url}`);
  }
  if (error.status) {
    console.error(`Status    : ${error.status}`);
  }
  console.error(`Retryable : ${error.retryable}`);
  console.error(`Timeout   : ${error.timeout}`);
  if (error.cause) {
    console.error(`---------------------------------------`);
    console.error(`Cause     : ${error.cause}`);
  }
  console.error('───────────────────────────────────────');
};
