import { createDownloadProgressStream } from '../utils/createDownloadProgressStream';
import type { ProgressEvent } from '../types/http.types';

export type { ProgressEvent };

/**
 * Opt-in helper to wrap a response stream with download progress callbacks.
 */
export const withDownloadProgress = (
  stream: ReadableStream<Uint8Array>,
  total: number | undefined,
  onDownloadProgress: (event: ProgressEvent) => void,
) => createDownloadProgressStream(stream, total, onDownloadProgress);
