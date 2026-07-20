import type { Point } from "./schemas.js";
import type { Luminaire } from "./schemas.js";
import { generateGridPlacementPoints } from "./grid-placement.js";

export function createLuminairesFromGridPoints(input: {
  roomId: string;
  productId: string;
  points: readonly Point[];
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
    rotationDegrees: 0,
    placementSource: "generated" as const,
    createdAt,
  }));
}

export function generateLuminairesForRoom(input: {
  room: import("./schemas.js").Room;
  scale: import("./schemas.js").ScaleCalibration;
  productId: string;
  quantity: number;
  wallMarginMetres: number;
  createId: () => string;
}): { luminaires: Luminaire[]; warnings: string[] } {
  const result = generateGridPlacementPoints({
    room: input.room,
    scale: input.scale,
    quantity: input.quantity,
    wallMarginMetres: input.wallMarginMetres,
  });

  const luminaires = createLuminairesFromGridPoints({
    roomId: input.room.id,
    productId: input.productId,
    points: result.points,
    createId: input.createId,
  });

  return { luminaires, warnings: result.warnings };
}
