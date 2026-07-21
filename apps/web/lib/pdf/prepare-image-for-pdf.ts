import {
  PNG_DATA_URL_PREFIX,
  validatePngDataUrl,
} from "@lightsale/shared";
import { loadImageElement } from "./render-plan-image";

export { PNG_DATA_URL_PREFIX, validatePngDataUrl };

export function rasterizeHtmlImageToPngDataUrl(
  image: HTMLImageElement,
  width?: number,
  height?: number,
): string | null {
  const w = width ?? image.naturalWidth ?? image.width;
  const h = height ?? image.naturalHeight ?? image.height;
  if (w <= 0 || h <= 0) {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }
  ctx.drawImage(image, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/png");
  return validatePngDataUrl(dataUrl) ? dataUrl : null;
}

export async function prepareImageForPdf(
  source: string | HTMLImageElement,
  options?: { width?: number; height?: number },
): Promise<string | null> {
  try {
    const image =
      typeof source === "string" ? await loadImageElement(source) : source;
    await image.decode?.().catch(() => undefined);
    return rasterizeHtmlImageToPngDataUrl(image, options?.width, options?.height);
  } catch {
    return null;
  }
}

export async function preparePngDataUrlForPdfExport(
  dataUrl: string,
): Promise<string | null> {
  if (validatePngDataUrl(dataUrl)) {
    return dataUrl;
  }
  return prepareImageForPdf(dataUrl);
}

export const PDF_IMAGE_ERROR_NL =
  "De PDF kon niet worden gemaakt doordat één van de afbeeldingen niet correct kon worden verwerkt.";
