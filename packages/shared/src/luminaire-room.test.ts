import { describe, expect, it } from "vitest";
import {
  countLuminairesOutsideRoom,
  defaultManualLuminairePosition,
  isLuminaireInsideRoom,
} from "./luminaire-room.js";

const room = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Room",
  vertices: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ],
  roomType: "open_office" as const,
  ceilingHeightMetres: 3,
  ceilingType: "exposed" as const,
  targetLux: 300,
  stylePreset: "functional" as const,
  selectedProductId: null,
  utilisationFactor: 0.6,
  maintenanceFactor: 0.8,
};

describe("luminaire-room helpers", () => {
  it("places manual default at centroid inside square room", () => {
    const point = defaultManualLuminairePosition(room);
    expect(isLuminaireInsideRoom({ ...point, roomId: room.id }, room)).toBe(
      true,
    );
  });

  it("counts luminaires outside room boundary", () => {
    const luminaires = [
      {
        id: "660e8400-e29b-41d4-a716-446655440001",
        roomId: room.id,
        productId: "demo-downlight-evo-12w",
        x: 50,
        y: 50,
        rotationDegrees: 0,
        placementSource: "manual" as const,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "660e8400-e29b-41d4-a716-446655440002",
        roomId: room.id,
        productId: "demo-downlight-evo-12w",
        x: 150,
        y: 50,
        rotationDegrees: 0,
        placementSource: "manual" as const,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    expect(countLuminairesOutsideRoom(luminaires, room)).toBe(1);
  });
});
