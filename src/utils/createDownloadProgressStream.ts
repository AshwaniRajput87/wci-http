import { WciHttpConfig, ProgressEvent } from '../types/http.types';

type ProgressCallback = (progressEvent: ProgressEvent) => void;

/**
 * Creates a ReadableStream that tracks download progress.
 *
 * @param originalStream The original ReadableStream (e.g., response.body).
 * @param total The total expected size of the download, usually from Content-Length header.
 * @param onDownloadProgress The callback to invoke with progress events.
 * @returns A new ReadableStream that emits progress events.
 */
export function createDownloadProgressStream(
  originalStream: ReadableStream<Uint8Array>,
  total: number | undefined,
  onDownloadProgress: ProgressCallback,
): ReadableStream<Uint8Array> {
  let loaded = 0;
  const reader = originalStream.getReader();

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();

      if (done) {
        // Ensure final progress event is dispatched when download is complete
        onDownloadProgress({
          loaded: total || loaded, // If total is known, use it; otherwise, use the last loaded
          total,
          progress: total ? 1 : undefined,
        });
        controller.close();
        return;
      }

      loaded += value.byteLength;
      onDownloadProgress({
        loaded,
        total,
        progress: total ? loaded / total : undefined,
      });
      controller.enqueue(value);
    },
    cancel(reason) {
      reader.cancel(reason);
    },
  });
}
