import type { ProductCategory } from "./product-catalog.js";
import type { Point, Room, ScaleCalibration } from "./schemas.js";
import { roomPolygonCentroid } from "./luminaire-room.js";
import { metresPerPixel } from "./scale.js";
import {
  isPointInPolygon,
  polygonAxisAlignedBounds,
} from "./point-in-polygon.js";
import {
  chooseGridDimensions,
  DEFAULT_LAYOUT_WALL_MARGIN_METRES,
  generateGridPlacementPoints,
  generateSymmetricGridPoints,
  selectGridPointsForQuantity,
  type GenerateGridPlacementResult,
} from "./grid-placement.js";

export type { GenerateGridPlacementResult };

export interface PlacementPoint {
  x: number;
  y: number;
  rotationDegrees: number;
}

export interface GenerateCategoryPlacementInput {
  room: Room;
  scale: ScaleCalibration;
  quantity: number;
  category: ProductCategory;
  wallMarginMetres?: number;
}

function longestAxisRotationDegrees(room: Room): number {
  const bounds = polygonAxisAlignedBounds(room.vertices);
  if (bounds === null) {
    return 0;
  }
  return bounds.width >= bounds.height ? 0 : 90;
}

function insetCentroid(room: Room, scale: ScaleCalibration, marginMetres: number): Point {
  const bounds = polygonAxisAlignedBounds(room.vertices);
  const mpp = metresPerPixel(scale);
  const marginPx = marginMetres / mpp;
  if (bounds === null) {
    return roomPolygonCentroid(room.vertices);
  }
  return {
    x: bounds.minX + marginPx + (bounds.width - 2 * marginPx) / 2,
    y: bounds.minY + marginPx + (bounds.height - 2 * marginPx) / 2,
  };
}

function linePointsThroughCentroid(
  centre: Point,
  count: number,
  spanPixels: number,
  axisDegrees: number,
): Point[] {
  if (count <= 0) {
    return [];
  }
  const radians = (axisDegrees * Math.PI) / 180;
  const ux = Math.cos(radians);
  const uy = Math.sin(radians);
  const points: Point[] = [];
  for (let index = 0; index < count; index += 1) {
    const t =
      count === 1 ? 0 : (index / (count - 1) - 0.5) * spanPixels;
    points.push({
      x: centre.x + ux * t,
      y: centre.y + uy * t,
    });
  }
  return points;
}

function filterInside(room: Room, points: readonly Point[]): Point[] {
  return points.filter((point) => isPointInPolygon(point, room.vertices));
}

function formatPartialPlacementWarning(placed: number, requested: number): string {
  return `${placed} of ${requested} luminaires could be placed automatically. Adjust the layout manually or reduce the wall margin.`;
}

function gridResultToPlacementPoints(
  result: GenerateGridPlacementResult,
  rotationDegrees: number,
): { points: PlacementPoint[]; warnings: string[] } {
  const warnings = [...result.warnings];
  if (result.placedCount < result.requestedCount && result.requestedCount > 0) {
    const partial = formatPartialPlacementWarning(
      result.placedCount,
      result.requestedCount,
    );
    if (!warnings.some((item) => item.includes("could be placed automatically"))) {
      warnings.push(partial);
    }
  }
  return {
    points: result.points.map((point) => ({
      ...point,
      rotationDegrees,
    })),
    warnings,
  };
}

function generatePendantPlacementPoints(
  input: GenerateCategoryPlacementInput,
): { points: PlacementPoint[]; warnings: string[] } {
  const requested = Math.max(0, Math.floor(input.quantity));
  if (requested === 0) {
    return { points: [], warnings: ["Calculated quantity is zero."] };
  }

  const marginMetres =
    input.wallMarginMetres ?? DEFAULT_LAYOUT_WALL_MARGIN_METRES;
  const axis = longestAxisRotationDegrees(input.room);
  const centre = roomPolygonCentroid(input.room.vertices);
  const bounds = polygonAxisAlignedBounds(input.room.vertices);
  const mpp = metresPerPixel(input.scale);
  const marginPx = marginMetres / mpp;
  const span =
    bounds === null
      ? 40
      : Math.max(
          20,
          (axis === 0 ? bounds.width : bounds.height) - 2 * marginPx,
        );

  let candidates: Point[] = [];
  if (requested === 1) {
    candidates = [centre];
  } else if (requested === 2) {
    candidates = linePointsThroughCentroid(centre, 2, span, axis);
  } else if (requested === 3) {
    candidates = linePointsThroughCentroid(centre, 3, span, axis);
    if (filterInside(input.room, candidates).length < 3) {
      const triangleSpan = span * 0.6;
      const radians = (axis * Math.PI) / 180;
      const ux = Math.cos(radians);
      const uy = Math.sin(radians);
      const px = -uy;
      const py = ux;
      candidates = [
        centre,
        {
          x: centre.x + ux * triangleSpan * 0.5,
          y: centre.y + uy * triangleSpan * 0.5,
        },
        {
          x: centre.x + px * triangleSpan * 0.4,
          y: centre.y + py * triangleSpan * 0.4,
        },
      ];
    }
  } else {
    const grid = generateGridPlacementPoints({
      room: input.room,
      scale: input.scale,
      quantity: requested,
      wallMarginMetres: marginMetres,
    });
    return gridResultToPlacementPoints(grid, 0);
  }

  const inside = filterInside(input.room, candidates);
  const centreInset = insetCentroid(input.room, input.scale, marginMetres);
  const selected = selectGridPointsForQuantity(
    inside,
    requested,
    centreInset,
  );
  const warnings: string[] = [];
  if (selected.length < requested) {
    warnings.push(formatPartialPlacementWarning(selected.length, requested));
  }
  return {
    points: selected.map((point) => ({
      ...point,
      rotationDegrees: 0,
    })),
    warnings,
  };
}

function generateLinearPlacementPoints(
  input: GenerateCategoryPlacementInput,
): { points: PlacementPoint[]; warnings: string[] } {
  const requested = Math.max(0, Math.floor(input.quantity));
  if (requested === 0) {
    return { points: [], warnings: ["Calculated quantity is zero."] };
  }

  const marginMetres =
    input.wallMarginMetres ?? DEFAULT_LAYOUT_WALL_MARGIN_METRES;
  const axis = longestAxisRotationDegrees(input.room);
  const bounds = polygonAxisAlignedBounds(input.room.vertices);
  const mpp = metresPerPixel(input.scale);
  const marginPx = marginMetres / mpp;

  if (bounds === null) {
    return { points: [], warnings: ["Room polygon has no usable bounds."] };
  }

  const alongHorizontal = axis === 0;
  const insetWidth = bounds.width - 2 * marginPx;
  const insetHeight = bounds.height - 2 * marginPx;
  if (insetWidth <= 0 || insetHeight <= 0) {
    return {
      points: [],
      warnings: ["Room is too small for the wall margin."],
    };
  }

  const rows = alongHorizontal
    ? Math.max(1, Math.ceil(Math.sqrt(requested)))
    : Math.max(1, Math.ceil(requested / Math.max(1, Math.ceil(Math.sqrt(requested)))));
  const cols = Math.ceil(requested / rows);
  const gridPoints = generateSymmetricGridPoints(
    bounds.minX + marginPx,
    bounds.minY + marginPx,
    insetWidth,
    insetHeight,
    rows,
    cols,
  );
  const inside = filterInside(input.room, gridPoints);
  const centre = insetCentroid(input.room, input.scale, marginMetres);
  const selected = selectGridPointsForQuantity(inside, requested, centre);
  const warnings: string[] = [];
  if (selected.length < requested) {
    warnings.push(formatPartialPlacementWarning(selected.length, requested));
  }
  return {
    points: selected.map((point) => ({
      ...point,
      rotationDegrees: axis,
    })),
    warnings,
  };
}

function sampleWallPlacementPoints(
  room: Room,
  scale: ScaleCalibration,
  quantity: number,
  marginMetres: number,
): { points: PlacementPoint[]; warnings: string[] } {
  const vertices = room.vertices;
  if (vertices.length < 3 || quantity <= 0) {
    return { points: [], warnings: ["Cannot place wall luminaires on this room."] };
  }

  const mpp = metresPerPixel(scale);
  const marginPx = marginMetres / mpp;
  const cornerOffsetPx = marginPx * 1.5;

  const edgeSamples: { point: Point; rotation: number; length: number }[] = [];
  for (let index = 0; index < vertices.length; index += 1) {
    const a = vertices[index]!;
    const b = vertices[(index + 1) % vertices.length]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    if (length <= cornerOffsetPx * 2) {
      continue;
    }
    const steps = Math.max(1, Math.floor(length / (marginPx * 2)));
    const nx = -dy / length;
    const ny = dx / length;
    const rotation = (Math.atan2(ny, nx) * 180) / Math.PI + 90;
    for (let step = 1; step <= steps; step += 1) {
      const t = step / (steps + 1);
      const px = a.x + dx * t;
      const py = a.y + dy * t;
      const inset = 4;
      const candidate = {
        x: px + nx * inset,
        y: py + ny * inset,
      };
      if (isPointInPolygon(candidate, vertices)) {
        edgeSamples.push({ point: candidate, rotation, length: length / steps });
      }
    }
  }

  if (edgeSamples.length === 0) {
    const fallback = generateGridPlacementPoints({
      room,
      scale,
      quantity,
      wallMarginMetres: marginMetres,
    });
    const warnings = [
      "Wall placement used an interior fallback pattern for this room.",
      ...fallback.warnings,
    ];
    return gridResultToPlacementPoints(fallback, 0);
  }

  edgeSamples.sort((a, b) => b.length - a.length);
  const chosen: PlacementPoint[] = [];
  let sampleIndex = 0;
  while (chosen.length < quantity && sampleIndex < edgeSamples.length * 3) {
    const sample = edgeSamples[sampleIndex % edgeSamples.length]!;
    if (!chosen.some((item) => item.x === sample.point.x && item.y === sample.point.y)) {
      chosen.push({
        x: sample.point.x,
        y: sample.point.y,
        rotationDegrees: sample.rotation,
      });
    }
    sampleIndex += 1;
  }

  const warnings: string[] = [];
  if (chosen.length < quantity) {
    warnings.push(formatPartialPlacementWarning(chosen.length, quantity));
  }
  return { points: chosen.slice(0, quantity), warnings };
}

export function generateCategoryPlacementPoints(
  input: GenerateCategoryPlacementInput,
): { points: PlacementPoint[]; warnings: string[] } {
  const category = input.category;
  const marginMetres =
    input.wallMarginMetres ?? DEFAULT_LAYOUT_WALL_MARGIN_METRES;

  if (
    category === "downlight" ||
    category === "surface_spot" ||
    category === "panel" ||
    category === "recessed_spot" ||
    category === "led_panel" ||
    category === "tracklighting"
  ) {
    const grid = generateGridPlacementPoints({
      room: input.room,
      scale: input.scale,
      quantity: input.quantity,
      wallMarginMetres: marginMetres,
    });
    return gridResultToPlacementPoints(grid, 0);
  }

  if (category === "pendant") {
    return generatePendantPlacementPoints(input);
  }

  if (category === "track_spot") {
    const grid = generateGridPlacementPoints({
      room: input.room,
      scale: input.scale,
      quantity: input.quantity,
      wallMarginMetres: marginMetres,
    });
    const axis = longestAxisRotationDegrees(input.room);
    return gridResultToPlacementPoints(grid, axis);
  }

  if (category === "linear") {
    return generateLinearPlacementPoints(input);
  }

  const grid = generateGridPlacementPoints({
    room: input.room,
    scale: input.scale,
    quantity: input.quantity,
    wallMarginMetres: marginMetres,
  });
  return gridResultToPlacementPoints(grid, 0);
}

/** @deprecated Category no longer blocks automatic placement. */
export function isManualPlacementOnlyCategory(_category: ProductCategory): boolean {
  return false;
}

/** @deprecated All catalogue categories support automatic placement. */
export function supportsAutomaticGridPlacement(_category: ProductCategory): boolean {
  return true;
}

export const MANUAL_ONLY_PLACEMENT_CATEGORIES = [] as const;

export function generateWallLuminairePlacementPoints(
  input: GenerateCategoryPlacementInput,
): { points: PlacementPoint[]; warnings: string[] } {
  return sampleWallPlacementPoints(
    input.room,
    input.scale,
    Math.max(0, Math.floor(input.quantity)),
    input.wallMarginMetres ?? DEFAULT_LAYOUT_WALL_MARGIN_METRES,
  );
}

export function buildLayoutProposalPreviewText(input: {
  quantity: number | null;
  productName: string;
  targetLux: number;
}): string | null {
  if (input.quantity === null || input.quantity <= 0) {
    return null;
  }
  return `Proposal: approximately ${input.quantity} luminaires using ${input.productName} to achieve ${input.targetLux} lux.`;
}

export function buildLayoutGenerationResultText(input: {
  placedCount: number;
  requestedCount: number;
  productName: string;
}): string {
  if (input.placedCount >= input.requestedCount) {
    return `${input.placedCount} luminaires placed using ${input.productName}.`;
  }
  return `${input.placedCount} of ${input.requestedCount} luminaires placed automatically using ${input.productName}. Manual adjustment is recommended.`;
}
