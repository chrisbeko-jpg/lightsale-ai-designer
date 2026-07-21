import type { Point, ViewportState } from "@lightsale/shared";
import { screenToCanvas } from "@lightsale/shared";
import type { CanvasHostRect } from "./types";

export function isScreenPointOverCanvasHost(
  screenX: number,
  screenY: number,
  rect: CanvasHostRect | null,
): boolean {
  if (rect === null || rect.width <= 0 || rect.height <= 0) {
    return false;
  }
  return (
    screenX >= rect.left &&
    screenX <= rect.left + rect.width &&
    screenY >= rect.top &&
    screenY <= rect.top + rect.height
  );
}

export function screenPointToCanvas(
  screenX: number,
  screenY: number,
  rect: CanvasHostRect,
  viewport: ViewportState,
): Point {
  return screenToCanvas(
    {
      x: screenX - rect.left,
      y: screenY - rect.top,
    },
    viewport,
  );
}

export function canvasHostRectFromDomRect(rect: DOMRectReadOnly): CanvasHostRect {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}
