import { WciHttp } from './client/WciHttp'
import { httpClient } from './client/httpClient'
import type { WciHttpConfig } from './types/http.types'

export { httpClient }

// Create a default instance
const wciHttp = new WciHttp()

// Export the create method
export const createInstance = (config: WciHttpConfig) => {
  return new WciHttp(config)
}

// Export the default instance
export default wciHttp

// Export methods from the default instance
export const { get, post, put, patch, delete: del, head, options } = wciHttp

// Export all types
export * from './types/http.types'
export * from './types/loggingTypes'
export * from './types/success.types'

// Export all errors
export * from './errors/WciHttpError'
export * from './errors/errorCatalog'
export * from './errors/httpErrorCodes'

// Export utilities
export { buildURL } from './utils/buildURL'
export { defaultParamsSerializer as paramsSerializer } from './utils/paramsSerializer'
