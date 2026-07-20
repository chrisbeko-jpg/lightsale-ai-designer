import type { Point } from "./schemas.js";

/**
 * Ray-casting test: true if point is inside the closed polygon (inclusive of edges).
 */
export function isPointInPolygon(point: Point, polygon: readonly Point[]): boolean {
  if (polygon.length < 3) {
    return false;
  }

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const vi = polygon[i];
    const vj = polygon[j];
    if (vi === undefined || vj === undefined) {
      continue;
    }

    const intersects =
      vi.y > point.y !== vj.y > point.y &&
      point.x <
        ((vj.x - vi.x) * (point.y - vi.y)) / (vj.y - vi.y + Number.EPSILON) +
          vi.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

export interface AxisAlignedBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export function polygonAxisAlignedBounds(
  polygon: readonly Point[],
): AxisAlignedBounds | null {
  if (polygon.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const vertex of polygon) {
    minX = Math.min(minX, vertex.x);
    minY = Math.min(minY, vertex.y);
    maxX = Math.max(maxX, vertex.x);
    maxY = Math.max(maxY, vertex.y);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
