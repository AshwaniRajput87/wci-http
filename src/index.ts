import { WciHttp } from "./client/WciHttp";
import type { HttpClientConfig } from "./types/http.types";

// Create a default instance
const wciHttp = new WciHttp();

// Export the create method
export const createInstance = (config: HttpClientConfig) => {
  return new WciHttp(config);
};

// Export the default instance
export default wciHttp;

// Export methods from the default instance
export const { get, post, put, patch, head, options, del } = wciHttp;

// Export all types
export * from "./types/http.types";
export * from "./types/loggingTypes";
export * from "./types/success.types";

// Export all errors
export * from "./errors/WciHttpError";
export * from "./errors/errorCatalog";
export * from "./errors/httpErrorCodes";