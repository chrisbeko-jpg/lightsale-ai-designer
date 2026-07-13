import type { Point, ScaleCalibration } from "./schemas.js";
import { metresPerPixel } from "./scale.js";

/**
 * Shoelace formula for polygon area in canvas pixel².
 * Vertices must be in order (clockwise or counter-clockwise).
 */
export function polygonAreaPixels(vertices: readonly Point[]): number {
  if (vertices.length < 3) {
    return 0;
  }

  let sum = 0;
  const n = vertices.length;

  for (let i = 0; i < n; i += 1) {
    const current = vertices[i];
    const next = vertices[(i + 1) % n];
    if (!current || !next) {
      continue;
    }
    sum += current.x * next.y - next.x * current.y;
  }

  return Math.abs(sum) / 2;
}

/** Polygon area in square metres when scale is calibrated. */
export function polygonAreaSquareMetres(
  vertices: readonly Point[],
  calibration: ScaleCalibration,
): number {
  const areaPixels = polygonAreaPixels(vertices);
  const mpp = metresPerPixel(calibration);
  return areaPixels * mpp * mpp;
}

/** Format area for display (1 decimal place). */
export function formatAreaSquareMetres(area: number): string {
  return `${area.toFixed(1)} m²`;
}
