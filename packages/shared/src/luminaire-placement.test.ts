import { describe, expect, it } from "vitest";
import {
  createLuminaireAtPoint,
  findRoomContainingPoint,
  isPointWithinFloorPlanBounds,
  validateLuminairePlacementAtPoint,
} from "./luminaire-placement.js";
import type { Room, ScaleCalibration } from "./schemas.js";
import { getCatalogProducts } from "./product-catalog.js";

const scale: ScaleCalibration = {
  pointA: { x: 0, y: 0 },
  pointB: { x: 100, y: 0 },
  realDistanceMetres: 1,
};

const room: Room = {
  id: "room-1",
  name: "Office",
  roomType: "open_office",
  ceilingType: "grid",
  stylePreset: "functional",
  targetLux: 500,
  utilisationFactor: 0.6,
  maintenanceFactor: 0.8,
  selectedProductId: "wl-bari-small",
  vertices: [
    { x: 50, y: 50 },
    { x: 250, y: 50 },
    { x: 250, y: 250 },
    { x: 50, y: 250 },
  ],
};

describe("luminaire placement", () => {
  it("finds room for point inside polygon", () => {
    expect(findRoomContainingPoint({ x: 100, y: 100 }, [room])?.id).toBe("room-1");
  });

  it("rejects point outside floor plan bounds", () => {
    expect(
      isPointWithinFloorPlanBounds({ x: 900, y: 100 }, { width: 800, height: 600 }),
    ).toBe(false);
  });

  it("validates compatible product at point", () => {
    const product = getCatalogProducts().find((p) => p.id === "wl-bari-small");
    const result = validateLuminairePlacementAtPoint({
      scale,
      room,
      product,
      point: { x: 120, y: 120 },
      floorPlanBounds: { width: 800, height: 600 },
      catalogProducts: getCatalogProducts(),
    });
    expect(result.ok).toBe(true);
  });

  it("rejects placement outside room", () => {
    const product = getCatalogProducts().find((p) => p.id === "wl-bari-small");
    const result = validateLuminairePlacementAtPoint({
      scale,
      room,
      product,
      point: { x: 10, y: 10 },
      floorPlanBounds: null,
      catalogProducts: getCatalogProducts(),
    });
    expect(result.ok).toBe(false);
  });

  it("creates luminaire with product id at point", () => {
    const luminaire = createLuminaireAtPoint({
      id: "test-luminaire-id",
      roomId: "room-1",
      productId: "wl-bari-small",
      point: { x: 80, y: 90 },
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(luminaire.productId).toBe("wl-bari-small");
    expect(luminaire.x).toBe(80);
    expect(luminaire.y).toBe(90);
  });
});
