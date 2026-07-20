import { describe, expect, it } from "vitest";
import { normalizeRoom, type Room } from "./schemas.js";
import {
  calculateRequiredLumens,
  defaultTargetLuxForRoomType,
  formatRequiredLumens,
  getEffectiveTargetLux,
  isTargetLuxUnset,
  targetLuxAfterRoomTypeChange,
} from "./room-lighting.js";
import { migrateLegacyRoomFields } from "./room-migration.js";

const baseRoom = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Test room",
  vertices: [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ],
};

describe("defaultTargetLuxForRoomType", () => {
  it("returns indicative defaults per room type", () => {
    expect(defaultTargetLuxForRoomType("kitchen")).toBe(300);
    expect(defaultTargetLuxForRoomType("bedroom")).toBe(100);
    expect(defaultTargetLuxForRoomType("open_office")).toBe(500);
  });
});

describe("getEffectiveTargetLux", () => {
  it("uses default lux when targetLux is unset", () => {
    const room: Pick<Room, "roomType" | "targetLux"> = {
      roomType: "living_room",
      targetLux: null,
    };
    expect(getEffectiveTargetLux(room)).toBe(150);
    expect(isTargetLuxUnset(room)).toBe(true);
  });

  it("preserves user override when targetLux is set", () => {
    const room: Pick<Room, "roomType" | "targetLux"> = {
      roomType: "bedroom",
      targetLux: 250,
    };
    expect(getEffectiveTargetLux(room)).toBe(250);
    expect(isTargetLuxUnset(room)).toBe(false);
  });
});

describe("targetLuxAfterRoomTypeChange", () => {
  it("keeps explicit targetLux when room type changes", () => {
    expect(targetLuxAfterRoomTypeChange(400, "kitchen")).toBe(400);
  });

  it("keeps null when unset so defaults follow room type", () => {
    expect(targetLuxAfterRoomTypeChange(null, "kitchen")).toBe(null);
  });
});

describe("calculateRequiredLumens", () => {
  it("computes area times lux", () => {
    expect(calculateRequiredLumens(20, 300)).toBe(6000);
  });

  it("returns null for invalid area", () => {
    expect(calculateRequiredLumens(0, 300)).toBeNull();
  });

  it("formats lumens for display", () => {
    expect(formatRequiredLumens(6000)).toBe("6,000");
  });
});

describe("legacy room normalization", () => {
  it("migrates deprecated room types and style presets", () => {
    const migrated = migrateLegacyRoomFields({
      ...baseRoom,
      roomType: "warehouse",
      stylePreset: "high-bay",
      targetLux: null,
    });
    expect(migrated.roomType).toBe("storage");
    expect(migrated.stylePreset).toBe("industrial");
  });

  it("normalizes full legacy room through normalizeRoom", () => {
    const room = normalizeRoom({
      ...baseRoom,
      roomType: "office",
      stylePreset: "standard",
      targetLux: 120,
    });
    expect(room.roomType).toBe("open_office");
    expect(room.stylePreset).toBe("functional");
    expect(room.targetLux).toBe(120);
  });

  it("maps unknown legacy values to other and functional", () => {
    const room = normalizeRoom({
      ...baseRoom,
      roomType: "unknown_type",
      stylePreset: "unknown_style",
    });
    expect(room.roomType).toBe("other");
    expect(room.stylePreset).toBe("functional");
  });
});
