import { WciHttp } from './WciHttp'
import type { WciHttpConfig } from '../types/http.types'

// Create the default instance
const httpClientInstance = new WciHttp()

// Create a function that can be called directly and also has all the instance methods
const httpClient = Object.assign(
  async (config: WciHttpConfig) => {
    return await httpClientInstance.request(config)
  },
  {
    // Method shortcuts
    get: async (url: string, config?: WciHttpConfig) =>
      await httpClientInstance.get(url, config),
    post: async (url: string, data?: any, config?: WciHttpConfig) =>
      await httpClientInstance.post(url, data, config),
    put: async (url: string, data?: any, config?: WciHttpConfig) =>
      await httpClientInstance.put(url, data, config),
    patch: async (url: string, data?: any, config?: WciHttpConfig) =>
      await httpClientInstance.patch(url, data, config),
    delete: async (url: string, config?: WciHttpConfig) =>
      await httpClientInstance.delete(url, config),
    head: async (url: string, config?: WciHttpConfig) =>
      await httpClientInstance.head(url, config),
    options: async (url: string, config?: WciHttpConfig) =>
      await httpClientInstance.options(url, config),
    request: async (config: WciHttpConfig) =>
      await httpClientInstance.request(config),
    // Instance properties
    config: httpClientInstance.config,
    interceptors: httpClientInstance.interceptors,
    create: (config?: WciHttpConfig) => httpClientInstance.create(config),
  }
)

export { httpClient }
