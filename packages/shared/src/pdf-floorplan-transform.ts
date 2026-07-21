import { computeContainTransform } from "./plan-viewport.js";

export interface FloorplanPdfTransformInput {
  sourceWidth: number;
  sourceHeight: number;
  availableWidth: number;
  availableHeight: number;
  rotation?: number;
}

export interface FloorplanPdfTransform {
  renderWidth: number;
  renderHeight: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;
}

/**
 * Single contain-fit transform for PDF plan pages (and shared canvas/PDF rendering).
 */
export function calculateFloorplanPdfTransform(
  input: FloorplanPdfTransformInput,
): FloorplanPdfTransform {
  const rotation = input.rotation ?? 0;
  const transform = computeContainTransform(
    input.sourceWidth,
    input.sourceHeight,
    input.availableWidth,
    input.availableHeight,
  );
  return {
    renderWidth: transform.sourceWidth * transform.scale,
    renderHeight: transform.sourceHeight * transform.scale,
    offsetX: transform.offsetX,
    offsetY: transform.offsetY,
    scale: transform.scale,
    rotation,
  };
}
