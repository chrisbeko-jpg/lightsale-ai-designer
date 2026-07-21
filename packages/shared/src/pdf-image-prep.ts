export const PNG_DATA_URL_PREFIX = "data:image/png;base64,";

export function detectImageMimeTypeFromDataUrl(dataUrl: string): string | null {
  const match = /^data:([^;,]+)[;,]/i.exec(dataUrl.trim());
  return match?.[1]?.toLowerCase() ?? null;
}

export function validatePngDataUrl(dataUrl: string): boolean {
  if (!dataUrl.startsWith(PNG_DATA_URL_PREFIX)) {
    return false;
  }
  try {
    const base64 = dataUrl.slice(PNG_DATA_URL_PREFIX.length);
    const binary = atob(base64.slice(0, 8));
    const bytes = [...binary].map((char) => char.charCodeAt(0));
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  } catch {
    return false;
  }
}

export function detectImageMimeTypeFromBytes(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (bytes.length >= 4 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return "image/webp";
  }
  return null;
}
