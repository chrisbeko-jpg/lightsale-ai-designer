import type { Point } from "./schemas.js";
import type { Luminaire } from "./schemas.js";
import type { LightingProduct } from "./product-catalog.js";
import {
  generateCategoryPlacementPoints,
  type PlacementPoint,
} from "./category-placement.js";
import { filterCompatibleProducts } from "./luminaire-quantity.js";
import type { Room, ScaleCalibration } from "./schemas.js";
import { isPointInPolygon } from "./point-in-polygon.js";
import { isRoomGeometryValid } from "./luminaire-room.js";

export function createLuminairesFromPlacementPoints(input: {
  roomId: string;
  productId: string;
  points: readonly PlacementPoint[];
  createId: () => string;
  nowIso?: string;
}): Luminaire[] {
  const createdAt = input.nowIso ?? new Date().toISOString();
  return input.points.map((point) => ({
    id: input.createId(),
    roomId: input.roomId,
    productId: input.productId,
    x: point.x,
    y: point.y,
    rotationDegrees: point.rotationDegrees,
    placementSource: "generated" as const,
    createdAt,
  }));
}

/** @deprecated use createLuminairesFromPlacementPoints */
export function createLuminairesFromGridPoints(input: {
  roomId: string;
  productId: string;
  points: readonly Point[];
  createId: () => string;
  nowIso?: string;
}): Luminaire[] {
  return createLuminairesFromPlacementPoints({
    ...input,
    points: input.points.map((point) => ({
      ...point,
      rotationDegrees: 0,
    })),
  });
}

export function generateLuminairesForRoom(input: {
  room: Room;
  scale: ScaleCalibration;
  product: LightingProduct;
  quantity: number;
  wallMarginMetres: number;
  createId: () => string;
}): {
  luminaires: Luminaire[];
  warnings: string[];
  placedCount: number;
  requestedCount: number;
} {
  const requestedCount = Math.max(0, Math.floor(input.quantity));
  const { points, warnings } = generateCategoryPlacementPoints({
    room: input.room,
    scale: input.scale,
    quantity: requestedCount,
    category: input.product.category,
    wallMarginMetres: input.wallMarginMetres,
  });

  const luminaires = createLuminairesFromPlacementPoints({
    roomId: input.room.id,
    productId: input.product.id,
    points,
    createId: input.createId,
  });

  return {
    luminaires,
    warnings,
    placedCount: luminaires.length,
    requestedCount,
  };
}

export interface FloorPlanBounds {
  width: number;
  height: number;
}

export function isPointWithinFloorPlanBounds(
  point: Point,
  bounds: FloorPlanBounds | null,
): boolean {
  if (bounds === null || bounds.width <= 0 || bounds.height <= 0) {
    return true;
  }
  return (
    point.x >= 0 &&
    point.y >= 0 &&
    point.x <= bounds.width &&
    point.y <= bounds.height
  );
}

export function findRoomContainingPoint(
  point: Point,
  rooms: readonly Room[],
): Room | undefined {
  for (const room of rooms) {
    if (!isRoomGeometryValid(room)) {
      continue;
    }
    if (isPointInPolygon(point, room.vertices)) {
      return room;
    }
  }
  return undefined;
}

export interface LuminairePlacementValidationInput {
  scale: ScaleCalibration | null;
  room: Room;
  product: LightingProduct | undefined;
  point: Point;
  floorPlanBounds: FloorPlanBounds | null;
  catalogProducts?: readonly LightingProduct[];
}

export function validateLuminairePlacementAtPoint(
  input: LuminairePlacementValidationInput,
): { ok: boolean; reason: string | null } {
  if (input.scale === null) {
    return { ok: false, reason: "Configure scale before placing luminaires." };
  }
  if (!isRoomGeometryValid(input.room)) {
    return { ok: false, reason: "Room geometry is not valid." };
  }
  if (input.product === undefined) {
    return { ok: false, reason: "Select a product first." };
  }
  if (!isPointInPolygon(input.point, input.room.vertices)) {
    return { ok: false, reason: "Place the luminaire inside the room." };
  }
  if (!isPointWithinFloorPlanBounds(input.point, input.floorPlanBounds)) {
    return { ok: false, reason: "Place the luminaire on the floor plan." };
  }
  const catalog = input.catalogProducts ?? [];
  if (catalog.length > 0) {
    const compatible = filterCompatibleProducts(catalog, input.room);
    if (!compatible.some((item) => item.id === input.product!.id)) {
      return { ok: false, reason: "This product is not compatible with the room." };
    }
  }
  return { ok: true, reason: null };
}

export function createLuminaireAtPoint(input: {
  id: string;
  roomId: string;
  productId: string;
  point: Point;
  createdAt?: string;
}): Luminaire {
  return {
    id: input.id,
    roomId: input.roomId,
    productId: input.productId,
    x: input.point.x,
    y: input.point.y,
    rotationDegrees: 0,
    placementSource: "manual",
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}
