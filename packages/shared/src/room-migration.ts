const VALID_ROOM_TYPES = new Set<string>([
  "living_room",
  "kitchen",
  "dining_room",
  "bedroom",
  "bathroom",
  "hallway",
  "home_office",
  "open_office",
  "private_office",
  "meeting_room",
  "reception",
  "corridor",
  "storage",
  "toilet",
  "technical_room",
  "other",
]);

const VALID_STYLE_PRESETS = new Set<string>([
  "functional",
  "warm_modern",
  "minimal",
  "hotel_chic",
  "industrial",
  "architectural",
  "custom",
]);

const LEGACY_ROOM_TYPE_MAP: Record<string, string> = {
  warehouse: "storage",
  office: "open_office",
  production: "technical_room",
  corridor: "corridor",
};

const LEGACY_STYLE_PRESET_MAP: Record<string, string> = {
  standard: "functional",
  "high-bay": "industrial",
  ambient: "warm_modern",
  "task-focused": "functional",
  custom: "custom",
};

export function migrateLegacyRoomFields(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...raw };

  if (typeof next.roomType === "string") {
    if (!VALID_ROOM_TYPES.has(next.roomType)) {
      next.roomType = LEGACY_ROOM_TYPE_MAP[next.roomType] ?? "other";
    }
  }

  if (typeof next.stylePreset === "string") {
    if (!VALID_STYLE_PRESETS.has(next.stylePreset)) {
      next.stylePreset =
        LEGACY_STYLE_PRESET_MAP[next.stylePreset] ?? "functional";
    }
  }

  if (typeof next.utilisationFactor !== "number") {
    next.utilisationFactor = 0.6;
  }
  if (typeof next.maintenanceFactor !== "number") {
    next.maintenanceFactor = 0.8;
  }
  if (next.selectedProductId !== null && next.selectedProductId !== undefined) {
    if (typeof next.selectedProductId !== "string") {
      next.selectedProductId = null;
    }
  }

  return next;
}
