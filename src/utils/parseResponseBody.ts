import { WciHttpError } from "../errors/WciHttpError";
import { createHttpErrorCodes } from "../errors/httpErrorCodes";
import { HttpRequest } from "../types/http.types";
import { CONTENT_TYPES } from '../constants/protocol/contentTypes';

const httpErrorCodes = createHttpErrorCodes();

export async function parseResponseBody(response: Response, config: HttpRequest): Promise<any> {
    const { responseType } = config;
    const contentTypeHeader = response.headers.get("Content-Type") || "";

    // If responseType is explicitly 'stream', return the raw body
    if (responseType === 'stream') {
        return response.body;
    }

    // If responseType is explicitly defined, use it
    if (responseType) {
        switch (responseType) {
            case 'json':
                try {
                    return await response.json();
                } catch (e) {
                    throw new WciHttpError({
                        code: httpErrorCodes.INVALID_JSON,
                        message: "Failed to parse response as JSON",
                        cause: e,
                        url: config.url,
                        method: config.method,
                        status: response.status // Pass status to error
                    });
                }
            case 'text':
                return await response.text();
            case 'arraybuffer':
                return await response.arrayBuffer();
            case 'blob':
                return await response.blob();
            // No default here because we've handled explicit responseType.
            // If an unrecognized responseType comes here, it means we should fall through to content-type detection.
        }
    }

    // Fallback to content-type detection if responseType is not provided or recognized
    if (contentTypeHeader.includes(CONTENT_TYPES.JSON)) {
        try {
            // Axios-like behavior: empty body might be null
            const text = await response.text();
            return text ? JSON.parse(text) : null;
        } catch (e) {
            throw new WciHttpError({
                code: httpErrorCodes.INVALID_JSON,
                message: "Failed to parse response as JSON based on Content-Type header",
                cause: e,
                url: config.url,
                method: config.method,
                status: response.status // Pass status to error
            });
        }
    } else if (contentTypeHeader.includes(CONTENT_TYPES.OCTET_STREAM)) {
        return await response.arrayBuffer();
    } else if (contentTypeHeader.includes(CONTENT_TYPES.TEXT)) {
        return await response.text();
    }

    // Default fallback: return as text if no other type is determined
    return await response.text();
}
