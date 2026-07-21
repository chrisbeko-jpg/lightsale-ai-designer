import { describe, expect, it } from "vitest";
import {
  detectImageMimeTypeFromBytes,
  PNG_DATA_URL_PREFIX,
} from "./pdf-image-prep.js";

describe("pdf image prep", () => {
  it("detects PNG signature bytes", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(detectImageMimeTypeFromBytes(png)).toBe("image/png");
  });

  it("detects JPEG signature bytes", () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0x00]);
    expect(detectImageMimeTypeFromBytes(jpeg)).toBe("image/jpeg");
  });

  it("uses png data url prefix constant", () => {
    expect(PNG_DATA_URL_PREFIX).toBe("data:image/png;base64,");
  });
});
