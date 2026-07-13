import type { Point, ViewportState } from "./schemas.js";

/** Map canvas/world coordinates to screen coordinates. */
export function canvasToScreen(
  point: Point,
  viewport: ViewportState,
): Point {
  return {
    x: point.x * viewport.zoom + viewport.offsetX,
    y: point.y * viewport.zoom + viewport.offsetY,
  };
}

/** Map screen coordinates to canvas/world coordinates. */
export function screenToCanvas(
  point: Point,
  viewport: ViewportState,
): Point {
  return {
    x: (point.x - viewport.offsetX) / viewport.zoom,
    y: (point.y - viewport.offsetY) / viewport.zoom,
  };
}

/** Zoom around a screen-space anchor, returning updated viewport. */
export function zoomAtPoint(
  viewport: ViewportState,
  screenAnchor: Point,
  newZoom: number,
): ViewportState {
  const clampedZoom = Math.max(0.1, Math.min(10, newZoom));
  const canvasAnchor = screenToCanvas(screenAnchor, viewport);
  const newScreen = {
    x: canvasAnchor.x * clampedZoom + viewport.offsetX,
    y: canvasAnchor.y * clampedZoom + viewport.offsetY,
  };

  return {
    zoom: clampedZoom,
    offsetX: viewport.offsetX + (screenAnchor.x - newScreen.x),
    offsetY: viewport.offsetY + (screenAnchor.y - newScreen.y),
  };
}

/** Pan viewport by screen-space delta. */
export function panViewport(
  viewport: ViewportState,
  deltaX: number,
  deltaY: number,
): ViewportState {
  return {
    ...viewport,
    offsetX: viewport.offsetX + deltaX,
    offsetY: viewport.offsetY + deltaY,
  };
}
