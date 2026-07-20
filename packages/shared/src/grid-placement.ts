import type { ProductCategory } from "./product-catalog.js";
import type { Point, Room, ScaleCalibration } from "./schemas.js";
import { metresPerPixel } from "./scale.js";
import {
  isPointInPolygon,
  polygonAxisAlignedBounds,
} from "./point-in-polygon.js";

export const GRID_PLACEMENT_CATEGORIES = [
  "downlight",
  "surface_spot",
  "panel",
] as const satisfies readonly ProductCategory[];

export const DEFAULT_LAYOUT_WALL_MARGIN_METRES = 0.6;

const MARGIN_FALLBACK_STEP_METRES = 0.1;
const MIN_MARGIN_METRES = 0;

export interface GridDimensions {
  rows: number;
  cols: number;
}

/**
 * Pick rows × cols >= quantity with near-square shape and minimal empty cells.
 */
export function chooseGridDimensions(
  quantity: number,
  boundsWidth: number,
  boundsHeight: number,
): GridDimensions {
  if (quantity <= 0 || boundsWidth <= 0 || boundsHeight <= 0) {
    return { rows: 0, cols: 0 };
  }

  let bestRows = quantity;
  let bestCols = 1;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let rows = 1; rows <= quantity; rows++) {
    const cols = Math.ceil(quantity / rows);
    const cells = rows * cols;
    if (cells < quantity) {
      continue;
    }

    const waste = cells - quantity;
    const squarePenalty = Math.abs(rows - cols);
    const spacingAspect =
      boundsHeight > 0
        ? Math.abs(rows / boundsHeight - cols / boundsWidth)
        : Math.abs(rows - cols);

    const score = waste * 100 + squarePenalty * 2 + spacingAspect;

    if (score < bestScore) {
      bestScore = score;
      bestRows = rows;
      bestCols = cols;
    }
  }

  return { rows: bestRows, cols: bestCols };
}

export function generateSymmetricGridPoints(
  insetLeft: number,
  insetTop: number,
  insetWidth: number,
  insetHeight: number,
  rows: number,
  cols: number,
): Point[] {
  if (rows <= 0 || cols <= 0 || insetWidth <= 0 || insetHeight <= 0) {
    return [];
  }

  const points: Point[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      points.push({
        x: insetLeft + ((col + 0.5) * insetWidth) / cols,
        y: insetTop + ((row + 0.5) * insetHeight) / rows,
      });
    }
  }
  return points;
}

function insetBounds(
  bounds: NonNullable<ReturnType<typeof polygonAxisAlignedBounds>>,
  marginPixels: number,
): { left: number; top: number; width: number; height: number } | null {
  const left = bounds.minX + marginPixels;
  const top = bounds.minY + marginPixels;
  const width = bounds.width - 2 * marginPixels;
  const height = bounds.height - 2 * marginPixels;

  if (width <= 0 || height <= 0) {
    return null;
  }

  return { left, top, width, height };
}

function filterPointsInsidePolygon(
  points: readonly Point[],
  polygon: readonly Point[],
): Point[] {
  return points.filter((point) => isPointInPolygon(point, polygon));
}

/**
 * When more valid grid points exist than needed, keep a symmetric subset
 * (center-out ordering by distance to inset rectangle centre).
 */
export function selectGridPointsForQuantity(
  points: readonly Point[],
  quantity: number,
  insetCentre: Point,
): Point[] {
  if (points.length <= quantity) {
    return [...points];
  }

  const ranked = [...points].sort((a, b) => {
    const da =
      (a.x - insetCentre.x) ** 2 + (a.y - insetCentre.y) ** 2;
    const db =
      (b.x - insetCentre.x) ** 2 + (b.y - insetCentre.y) ** 2;
    return da - db;
  });

  return ranked.slice(0, quantity);
}

export interface GenerateGridPlacementInput {
  room: Room;
  scale: ScaleCalibration;
  quantity: number;
  wallMarginMetres?: number;
}

export interface GenerateGridPlacementResult {
  points: Point[];
  placedCount: number;
  requestedCount: number;
  warnings: string[];
  gridDimensions: GridDimensions | null;
  wallMarginMetresUsed: number;
}

export function generateGridPlacementPoints(
  input: GenerateGridPlacementInput,
): GenerateGridPlacementResult {
  const requestedCount = Math.max(0, Math.floor(input.quantity));
  const warnings: string[] = [];

  if (requestedCount === 0) {
    return {
      points: [],
      placedCount: 0,
      requestedCount: 0,
      warnings: ["Calculated quantity is zero."],
      gridDimensions: null,
      wallMarginMetresUsed: input.wallMarginMetres ?? DEFAULT_LAYOUT_WALL_MARGIN_METRES,
    };
  }

  const bounds = polygonAxisAlignedBounds(input.room.vertices);
  if (bounds === null || bounds.width <= 0 || bounds.height <= 0) {
    return {
      points: [],
      placedCount: 0,
      requestedCount,
      warnings: ["Room polygon has no usable bounds."],
      gridDimensions: null,
      wallMarginMetresUsed: input.wallMarginMetres ?? DEFAULT_LAYOUT_WALL_MARGIN_METRES,
    };
  }

  const mpp = metresPerPixel(input.scale);
  let marginMetres =
    input.wallMarginMetres ?? DEFAULT_LAYOUT_WALL_MARGIN_METRES;

  let placed: Point[] = [];
  let gridDimensions: GridDimensions | null = null;
  let marginUsed = marginMetres;

  while (marginMetres >= MIN_MARGIN_METRES - Number.EPSILON) {
    const marginPixels = marginMetres / mpp;
    const inset = insetBounds(bounds, marginPixels);
    if (inset === null) {
      marginMetres -= MARGIN_FALLBACK_STEP_METRES;
      continue;
    }

    gridDimensions = chooseGridDimensions(
      requestedCount,
      inset.width,
      inset.height,
    );

    const gridPoints = generateSymmetricGridPoints(
      inset.left,
      inset.top,
      inset.width,
      inset.height,
      gridDimensions.rows,
      gridDimensions.cols,
    );

    const inside = filterPointsInsidePolygon(gridPoints, input.room.vertices);
    const centre = {
      x: inset.left + inset.width / 2,
      y: inset.top + inset.height / 2,
    };
    placed = selectGridPointsForQuantity(inside, requestedCount, centre);
    marginUsed = marginMetres;

    if (placed.length >= requestedCount) {
      placed = placed.slice(0, requestedCount);
      break;
    }

    if (marginMetres <= MIN_MARGIN_METRES) {
      break;
    }
    marginMetres -= MARGIN_FALLBACK_STEP_METRES;
  }

  if (placed.length < requestedCount) {
    warnings.push(
      `${placed.length} of ${requestedCount} luminaires could be placed automatically. Adjust the layout manually or reduce the wall margin.`,
    );
  }

  for (const point of placed) {
    if (!isPointInPolygon(point, input.room.vertices)) {
      warnings.push("Internal error: a generated point lies outside the room.");
      break;
    }
  }

  return {
    points: placed,
    placedCount: placed.length,
    requestedCount,
    warnings,
    gridDimensions,
    wallMarginMetresUsed: marginUsed,
  };
}

export function countLuminairesForRoom(
  luminaires: readonly { roomId: string }[],
  roomId: string,
): number {
  return luminaires.filter((item) => item.roomId === roomId).length;
}

export function compareRoomLuminaireQuantities(
  calculatedQuantity: number | null,
  placedQuantity: number,
): number | null {
  if (calculatedQuantity === null) {
    return null;
  }
  return placedQuantity - calculatedQuantity;
}
