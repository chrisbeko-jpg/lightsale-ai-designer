import type { Point, ScaleCalibration } from "./schemas.js";

/** Euclidean distance between two canvas points (pixels). */
export function pixelDistance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Metres per pixel derived from a two-point calibration. */
export function metresPerPixel(calibration: ScaleCalibration): number {
  const pixelSpan = pixelDistance(calibration.pointA, calibration.pointB);
  if (pixelSpan === 0) {
    throw new Error("Calibration points must not be identical");
  }
  return calibration.realDistanceMetres / pixelSpan;
}

/** Convert a pixel length to metres using calibration. */
export function pixelsToMetres(
  pixelLength: number,
  calibration: ScaleCalibration,
): number {
  return pixelLength * metresPerPixel(calibration);
}

/** Convert canvas coordinates to metres relative to origin. */
export function pointToMetres(
  point: Point,
  calibration: ScaleCalibration,
): Point {
  const mpp = metresPerPixel(calibration);
  return { x: point.x * mpp, y: point.y * mpp };
}
