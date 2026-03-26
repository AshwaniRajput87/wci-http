import { createProgressStream } from '../utils/createProgressStream';
import type { ProgressEvent } from '../types/http.types';

export type { ProgressEvent };

/**
 * Opt-in helper to wire upload progress tracking without touching the core client.
 */
export const withUploadProgress = (
  body: BodyInit,
  onUploadProgress: (event: ProgressEvent) => void,
) => createProgressStream(body, onUploadProgress);
