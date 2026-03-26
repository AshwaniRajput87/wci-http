import { describe, it, expect } from "vitest";
import { CONTENT_TYPES } from "../../../src/constants/protocol/contentTypes";

describe("CONTENT_TYPES", () => {
  it("defines common content types", () => {
    expect(CONTENT_TYPES.JSON).toBe("application/json");
    expect(CONTENT_TYPES.FORM).toBe("application/x-www-form-urlencoded");
    expect(CONTENT_TYPES.MULTIPART).toBe("multipart/form-data");
    expect(CONTENT_TYPES.TEXT).toBe("text/plain");
    expect(CONTENT_TYPES.OCTET_STREAM).toBe("application/octet-stream");
    expect(CONTENT_TYPES.IMAGE).toBe("image/");
    expect(CONTENT_TYPES.AUDIO).toBe("audio/");
    expect(CONTENT_TYPES.VIDEO).toBe("video/*");
    expect(CONTENT_TYPES.EVENT_STREAM).toBe("text/event-stream");
  });
});
