import { WciHttp } from './WciHttp'
import type { WciHttpConfig } from '../types/http.types'

// Create the default instance
const httpClientInstance = new WciHttp()

// Create a function that can be called directly and also has all the instance methods
const httpClient = Object.assign(
  (config: WciHttpConfig) => httpClientInstance.request(config),
  {
    // Method shortcuts
    get: (url: string, config?: WciHttpConfig) =>
      httpClientInstance.get(url, config),
    post: (url: string, data?: any, config?: WciHttpConfig) =>
      httpClientInstance.post(url, data, config),
    put: (url: string, data?: any, config?: WciHttpConfig) =>
      httpClientInstance.put(url, data, config),
    patch: (url: string, data?: any, config?: WciHttpConfig) =>
      httpClientInstance.patch(url, data, config),
    delete: (url: string, config?: WciHttpConfig) =>
      httpClientInstance.delete(url, config),
    head: (url: string, config?: WciHttpConfig) =>
      httpClientInstance.head(url, config),
    options: (url: string, config?: WciHttpConfig) =>
      httpClientInstance.options(url, config),
    request: (config: WciHttpConfig) => httpClientInstance.request(config),
    // Instance properties
    config: httpClientInstance.config,
    interceptors: httpClientInstance.interceptors,
    create: (config?: WciHttpConfig) => httpClientInstance.create(config),
  }
)

export { httpClient }
