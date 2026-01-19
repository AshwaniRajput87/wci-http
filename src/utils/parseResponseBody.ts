import { WciHttpError } from '../errors/WciHttpError';
import { createHttpErrorCodes } from '../errors/httpErrorCodes';

const httpErrorCodes = createHttpErrorCodes();

/**
 * Parses the response body based on its Content-Type header,
 * mimicking Axios's automatic transformation.
 *
 * @param response The fetch Response object.
 * @returns A promise that resolves to the parsed body.
 */
export const parseResponseBody = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get('content-type');

  if (contentType) {
    // Handle JSON responses
    if (contentType.includes('application/json') || contentType.endsWith('+json')) {
      try {
        return await response.json();
      } catch (error) {
        throw new WciHttpError({
          code: httpErrorCodes.PARSE_ERROR,
          message: 'Failed to parse JSON response.',
          cause: error,
          url: response.url,
        });
      }
    }

    // Handle text-based responses
    if (contentType.startsWith('text/')) {
      try {
        return await response.text();
      } catch (error) {
        throw new WciHttpError({
          code: httpErrorCodes.PARSE_ERROR,
          message: 'Failed to parse text response.',
          cause: error,
          url: response.url,
        });
      }
    }
  }

  // Fallback for binary data or unknown content types
  try {
    return await response.arrayBuffer();
  } catch (error) {
    throw new WciHttpError({
      code: httpErrorCodes.PARSE_ERROR,
      message: 'Failed to parse response body as ArrayBuffer.',
      cause: error,
      url: response.url,
    });
  }
};
