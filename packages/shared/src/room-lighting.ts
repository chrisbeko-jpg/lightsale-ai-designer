import type { Room, RoomType } from "./schemas.js";

/** Indicative default illuminance (lux) by room type — not a compliance claim. */
export const DEFAULT_TARGET_LUX_BY_ROOM_TYPE: Record<RoomType, number> = {
  living_room: 150,
  kitchen: 300,
  dining_room: 200,
  bedroom: 100,
  bathroom: 200,
  hallway: 100,
  home_office: 500,
  open_office: 500,
  private_office: 500,
  meeting_room: 500,
  reception: 300,
  corridor: 100,
  storage: 150,
  toilet: 200,
  technical_room: 200,
  other: 200,
};

export function defaultTargetLuxForRoomType(roomType: RoomType): number {
  return DEFAULT_TARGET_LUX_BY_ROOM_TYPE[roomType];
}

/** Lux used for calculations: explicit override or default for room type. */
export function getEffectiveTargetLux(room: Pick<Room, "roomType" | "targetLux">): number {
  if (room.targetLux !== null) {
    return room.targetLux;
  }
  return defaultTargetLuxForRoomType(room.roomType);
}

export function isTargetLuxUnset(room: Pick<Room, "targetLux">): boolean {
  return room.targetLux === null;
}

/**
 * Indicative required luminous flux (lm) = area (m²) × target lux (lx).
 * Returns null when area is missing or non-positive.
 */
export function calculateRequiredLumens(
  roomAreaSquareMetres: number,
  targetLux: number,
): number | null {
  if (!Number.isFinite(roomAreaSquareMetres) || roomAreaSquareMetres <= 0) {
    return null;
  }
  if (!Number.isFinite(targetLux) || targetLux <= 0) {
    return null;
  }
  return roomAreaSquareMetres * targetLux;
}

export function formatRequiredLumens(lumens: number): string {
  const rounded = Math.round(lumens);
  return rounded.toLocaleString("en-GB");
}

/**
 * When room type changes, apply the new type's default lux only if the user has not set targetLux.
 */
export function targetLuxAfterRoomTypeChange(
  currentTargetLux: number | null,
  _newRoomType: RoomType,
): number | null {
  if (currentTargetLux !== null) {
    return currentTargetLux;
  }
  return null;
}
