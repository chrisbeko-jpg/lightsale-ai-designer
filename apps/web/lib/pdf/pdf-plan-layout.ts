import { calculateFloorplanPdfTransform } from "@lightsale/shared";

export interface PdfPlanImageMarginsMm {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function planImageRectMm(input: {
  pageWidthMm: number;
  pageHeightMm: number;
  sourceWidthPx: number;
  sourceHeightPx: number;
  margins: PdfPlanImageMarginsMm;
}) {
  const availableWidth =
    input.pageWidthMm - input.margins.left - input.margins.right;
  const availableHeight =
    input.pageHeightMm - input.margins.top - input.margins.bottom;
  const transform = calculateFloorplanPdfTransform({
    sourceWidth: input.sourceWidthPx,
    sourceHeight: input.sourceHeightPx,
    availableWidth,
    availableHeight,
  });
  return {
    x: input.margins.left + transform.offsetX,
    y: input.margins.top + transform.offsetY,
    width: transform.renderWidth,
    height: transform.renderHeight,
    transform,
  };
}
