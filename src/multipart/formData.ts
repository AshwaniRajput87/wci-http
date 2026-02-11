import { serializeRequestBody } from '../utils/bodySerializerzUtils';
import type { SerializedBodyResult } from '../utils/bodySerializerzUtils';

/**
 * Helper that exposes FormData serialization explicitly without touching the core client.
 */
export const createFormData = (formData: FormData): SerializedBodyResult =>
  serializeRequestBody({ body: formData });

export type { SerializedBodyResult };
