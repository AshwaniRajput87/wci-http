/**
 * Adapter selection and resolution logic.
 * 
 * Handles default adapter selection and explicit adapter override
 * via request config.
 */

import { HttpAdapter, AdapterResolver } from '../types/adapter.types';
import { defaultAdapter } from './defaultAdapter';
import { WciHttpConfig } from '../types/http.types';

/**
 * Default adapter resolver that selects appropriate adapter based on config.
 * 
 * @param config Request configuration
 * @returns Selected HTTP adapter
 */
export const defaultAdapterResolver: AdapterResolver = (config?: WciHttpConfig): HttpAdapter => {
  // If adapter is explicitly provided in config, use it
  if (config?.adapter) {
    return config.adapter;
  }

  // Otherwise use default fetch-based adapter
  return defaultAdapter;
};