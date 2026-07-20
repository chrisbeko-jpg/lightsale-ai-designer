import { describe, expect, it } from "vitest";
import {
  generateCategoryPlacementPoints,
  generateWallLuminairePlacementPoints,
  isManualPlacementOnlyCategory,
  buildLayoutProposalPreviewText,
} from "./category-placement.js";
import { validateLayoutGeneration } from "./layout-validation.js";
import { DEMO_LIGHTING_PRODUCTS } from "./product-catalog.js";
import { isPointInPolygon } from "./point-in-polygon.js";

const scale = {
  pointA: { x: 0, y: 0 },
  pointB: { x: 100, y: 0 },
  realDistanceMetres: 10,
};

const squareRoom = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Square",
  vertices: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ],
  roomType: "open_office" as const,
  ceilingHeightMetres: 3,
  ceilingType: "exposed" as const,
  targetLux: 500,
  stylePreset: "functional" as const,
  selectedProductId: "demo-downlight-evo-12w",
  utilisationFactor: 0.6,
  maintenanceFactor: 0.8,
};

function product(id: string) {
  return DEMO_LIGHTING_PRODUCTS.find((item) => item.id === id)!;
}

describe("category placement", () => {
  it("does not treat any category as manual-only", () => {
    for (const demo of DEMO_LIGHTING_PRODUCTS) {
      expect(isManualPlacementOnlyCategory(demo.category)).toBe(false);
    }
  });

  it("places downlights inside the room", () => {
    const result = generateCategoryPlacementPoints({
      room: squareRoom,
      scale,
      quantity: 4,
      category: "downlight",
      wallMarginMetres: 0.6,
    });
    expect(result.points.length).toBe(4);
    for (const point of result.points) {
      expect(isPointInPolygon(point, squareRoom.vertices)).toBe(true);
    }
  });

  it("places pendant luminaires automatically", () => {
    const result = generateCategoryPlacementPoints({
      room: squareRoom,
      scale,
      quantity: 2,
      category: "pendant",
      wallMarginMetres: 0.6,
    });
    expect(result.points.length).toBe(2);
  });

  it("places track spots with rotation along the long axis", () => {
    const result = generateCategoryPlacementPoints({
      room: squareRoom,
      scale,
      quantity: 4,
      category: "track_spot",
      wallMarginMetres: 0.6,
    });
    expect(result.points.length).toBeGreaterThan(0);
    expect(result.points[0]?.rotationDegrees).toBe(0);
  });

  it("places linear luminaires in rows", () => {
    const result = generateCategoryPlacementPoints({
      room: squareRoom,
      scale,
      quantity: 6,
      category: "linear",
      wallMarginMetres: 0.6,
    });
    expect(result.points.length).toBe(6);
  });

  it("best-effort wall luminaire placement", () => {
    const result = generateWallLuminairePlacementPoints({
      room: squareRoom,
      scale,
      quantity: 4,
      category: "surface_spot",
      wallMarginMetres: 0.6,
    });
    expect(result.points.length).toBeGreaterThan(0);
  });

  it("warns instead of blocking when placement is incomplete", () => {
    const lShapeRoom = {
      ...squareRoom,
      vertices: [
        { x: 0, y: 0 },
        { x: 80, y: 0 },
        { x: 80, y: 40 },
        { x: 40, y: 40 },
        { x: 40, y: 80 },
        { x: 0, y: 80 },
      ],
    };
    const result = generateCategoryPlacementPoints({
      room: lShapeRoom,
      scale,
      quantity: 80,
      category: "track_spot",
      wallMarginMetres: 0.6,
    });
    expect(result.points.length).toBeLessThan(80);
    expect(
      result.warnings.some((item) =>
        item.includes("could be placed automatically"),
      ),
    ).toBe(true);
    expect(
      result.warnings.some((item) =>
        item.includes("Manual placement only"),
      ),
    ).toBe(false);
  });
});

describe("validateLayoutGeneration", () => {
  it("allows track spot and pendant categories", () => {
    const area = 50;
    for (const id of ["demo-track-spot-25w", "demo-pendant-soft-40w"]) {
      const validation = validateLayoutGeneration({
        scale,
        roomAreaSquareMetres: area,
        room: squareRoom,
        product: product(id),
      });
      expect(validation.canGenerate).toBe(true);
      expect(validation.reason).toBeNull();
    }
  });

  it("blocks when luminous flux is missing", () => {
    const validation = validateLayoutGeneration({
      scale,
      roomAreaSquareMetres: 50,
      room: squareRoom,
      product: {
        ...product("demo-downlight-evo-12w"),
        luminousFluxLumens: 0,
      },
    });
    expect(validation.canGenerate).toBe(false);
  });
});

describe("buildLayoutProposalPreviewText", () => {
  it("describes the selected product proposal", () => {
    const text = buildLayoutProposalPreviewText({
      quantity: 8,
      productName: "Track Spot Accent 25W",
      targetLux: 500,
    });
    expect(text).toContain("8 luminaires");
    expect(text).toContain("Track Spot Accent 25W");
    expect(text).toContain("500 lux");
  });
});
