import type { Luminaire, Point, Room } from "./schemas.js";
import { polygonAxisAlignedBounds } from "./point-in-polygon.js";

export interface PlanViewportTransform {
  /** Uniform scale from source plan coordinates to target viewport pixels. */
  scale: number;
  offsetX: number;
  offsetY: number;
  sourceWidth: number;
  sourceHeight: number;
}

export interface PlanSourceDimensions {
  width: number;
  height: number;
  originX: number;
  originY: number;
}

export function computeContainTransform(
  sourceWidth: number,
  sourceHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): PlanViewportTransform {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      sourceWidth: Math.max(sourceWidth, 1),
      sourceHeight: Math.max(sourceHeight, 1),
    };
  }
  const scale = Math.min(viewportWidth / sourceWidth, viewportHeight / sourceHeight);
  const renderedWidth = sourceWidth * scale;
  const renderedHeight = sourceHeight * scale;
  return {
    scale,
    offsetX: (viewportWidth - renderedWidth) / 2,
    offsetY: (viewportHeight - renderedHeight) / 2,
    sourceWidth,
    sourceHeight,
  };
}

export function planPointToViewport(
  point: Point,
  transform: PlanViewportTransform,
): Point {
  return {
    x: transform.offsetX + point.x * transform.scale,
    y: transform.offsetY + point.y * transform.scale,
  };
}

export function renderedPlanSize(transform: PlanViewportTransform): {
  width: number;
  height: number;
} {
  return {
    width: transform.sourceWidth * transform.scale,
    height: transform.sourceHeight * transform.scale,
  };
}

export function aspectRatiosMatch(
  sourceWidth: number,
  sourceHeight: number,
  renderedWidth: number,
  renderedHeight: number,
  tolerance = 0.001,
): boolean {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return false;
  }
  const sourceRatio = sourceWidth / sourceHeight;
  const renderedRatio = renderedWidth / renderedHeight;
  return Math.abs(sourceRatio - renderedRatio) <= tolerance;
}

export function resolvePlanSourceDimensions(input: {
  floorPlanWidthPx: number | null;
  floorPlanHeightPx: number | null;
  rooms: readonly Room[];
  luminaires: readonly Luminaire[];
}): PlanSourceDimensions {
  if (
    input.floorPlanWidthPx !== null &&
    input.floorPlanHeightPx !== null &&
    input.floorPlanWidthPx > 0 &&
    input.floorPlanHeightPx > 0
  ) {
    return {
      width: input.floorPlanWidthPx,
      height: input.floorPlanHeightPx,
      originX: 0,
      originY: 0,
    };
  }

  const bounds = contentBoundsFromGeometry(input.rooms, input.luminaires);
  return {
    width: Math.max(bounds.maxX - bounds.minX, 1),
    height: Math.max(bounds.maxY - bounds.minY, 1),
    originX: bounds.minX,
    originY: bounds.minY,
  };
}

export function contentBoundsFromGeometry(
  rooms: readonly Room[],
  luminaires: readonly Luminaire[],
): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const add = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };
  for (const room of rooms) {
    for (const vertex of room.vertices) {
      add(vertex.x, vertex.y);
    }
  }
  for (const luminaire of luminaires) {
    add(luminaire.x, luminaire.y);
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
  }
  return { minX, minY, maxX, maxY };
}

export function normalizePointToPlanOrigin(
  point: Point,
  source: PlanSourceDimensions,
): Point {
  if (source.originX === 0 && source.originY === 0) {
    return point;
  }
  return {
    x: point.x - source.originX,
    y: point.y - source.originY,
  };
}

export function boundsFromRooms(rooms: readonly Room[]): ReturnType<
  typeof polygonAxisAlignedBounds
> {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const room of rooms) {
    const bounds = polygonAxisAlignedBounds(room.vertices);
    if (bounds === null) {
      continue;
    }
    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  }
  if (!Number.isFinite(minX)) {
    return null;
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
