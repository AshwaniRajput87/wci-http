import { ProgressEvent } from '../types/http.types';

type ProgressCallback = (progressEvent: ProgressEvent) => void;

/**
 * Creates a ReadableStream that tracks upload progress.
 * This is necessary because the native Fetch API does not expose upload progress events.
 *
 * @param body The original request body (e.g., string, FormData, Blob).
 * @param onUploadProgress The callback to invoke with progress events.
 * @returns An object containing the new ReadableStream body and its content-length (if computable).
 */
export async function createProgressStream(
  body: BodyInit,
  onUploadProgress: ProgressCallback,
): Promise<{ stream: ReadableStream<Uint8Array>; contentLength?: number }> {
  let processedBody: Blob | Uint8Array | string;
  let total: number | undefined;
  let contentType: string | undefined;

  if (typeof body === 'string') {
    processedBody = new TextEncoder().encode(body);
    total = processedBody.byteLength;
  } else if (body instanceof Blob) {
    processedBody = body;
    total = body.size;
  } else if (body instanceof FormData) {
    // FormData needs to be serialized to a Blob to get its size and stream it.
    // This requires a bit of a workaround to get the content-type with boundary.
    // We'll create a dummy request to let the browser serialize it, then extract.
    const dummyRequest = new Request('http://localhost', { method: 'POST', body: body });
    // This is a bit of a hack: Request.headers will be populated with the correct Content-Type
    // when a FormData body is provided, even if the URL is empty.
    contentType = dummyRequest.headers.get('Content-Type') || undefined;

    const formDataBlob = await new Response(body).blob();
    processedBody = formDataBlob;
    total = formDataBlob.size;
  } else if (body instanceof URLSearchParams) {
    processedBody = new TextEncoder().encode(body.toString());
    total = processedBody.byteLength;
  } else if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
    processedBody = new Uint8Array(body instanceof ArrayBuffer ? body : body.buffer);
    total = processedBody.byteLength;
  } else {
    // For other types like ReadableStream, we can't easily get the total size upfront.
    // We'll pass it through directly without total, and loaded will still be tracked.
    // If the body is already a ReadableStream, we return it as is.
    if (body instanceof ReadableStream) {
      return {
        stream: body,
        contentLength: undefined, // Total cannot be easily determined for arbitrary ReadableStreams
      };
    }
    // If it's something else that fetch can handle, we let fetch handle it directly
    // without progress for now, or stringify it if possible.
    // For simplicity, we'll convert unknown non-stream types to string/Uint8Array.
    try {
      processedBody = new TextEncoder().encode(String(body));
      total = processedBody.byteLength;
    } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
      console.warn('createProgressStream: Could not process unknown body type for upload progress', body);
      // Fallback: return original body as a stream without progress
      return {
        stream: new ReadableStream({
          start(controller) {
            if (body !== null && body !== undefined) {
              const encoder = new TextEncoder();
              controller.enqueue(encoder.encode(String(body)));
            }
            controller.close();
          },
        }),
        contentLength: undefined,
      };
    }
  }

  let loaded = 0;

  const reader = new Blob([processedBody]).stream().getReader();

  const progressStream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();

      if (done) {
        controller.close();
        return;
      }

      loaded += value.byteLength;
      onUploadProgress({
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

  return { stream: progressStream, contentLength: total, contentType };
}

// Add ProgressEvent and WciHttpConfig to global scope if needed for onUploadProgress and onDownloadProgress
// This is to avoid circular dependencies if WciHttpConfig itself is used in the ProgressEvent type
declare module '../types/http.types' {
  export interface WciHttpConfig {
    onUploadProgress?: ProgressCallback;
    onDownloadProgress?: ProgressCallback;
  }
}
