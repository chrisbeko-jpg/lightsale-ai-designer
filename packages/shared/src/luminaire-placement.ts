import type { Point } from "./schemas.js";
import type { Luminaire } from "./schemas.js";
import type { LightingProduct } from "./product-catalog.js";
import {
  generateCategoryPlacementPoints,
  type PlacementPoint,
} from "./category-placement.js";

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
  room: import("./schemas.js").Room;
  scale: import("./schemas.js").ScaleCalibration;
  product: LightingProduct;
  quantity: number;
  wallMarginMetres: number;
  createId: () => string;
}): { luminaires: Luminaire[]; warnings: string[]; placedCount: number; requestedCount: number } {
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
