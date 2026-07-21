import { describe, expect, it } from "vitest";
import {
  buildHeatmapDataForRoom,
  calculateIndicativeInfluenceRadiusMetres,
  relativeIntensityAtDistance,
  resolveBeamAngleDegrees,
  sampleHeatmapIntensityAtPoint,
} from "./heatmap-model.js";
import { DEMO_LIGHTING_PRODUCTS } from "./product-catalog.js";

const room = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Office",
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
  selectedProductId: null,
  utilisationFactor: 0.6,
  maintenanceFactor: 0.8,
};

describe("heatmap model", () => {
  it("uses fallback beam angle by category", () => {
    const downlight = DEMO_LIGHTING_PRODUCTS.find(
      (item) => item.category === "downlight",
    )!;
    const withoutBeam = { ...downlight, beamAngleDegrees: undefined };
    expect(resolveBeamAngleDegrees(withoutBeam)).toBe(60);
  });

  it("beam angle and ceiling height affect influence radius", () => {
    const product = DEMO_LIGHTING_PRODUCTS.find(
      (item) => item.id === "demo-track-spot-25w",
    )!;
    const low = calculateIndicativeInfluenceRadiusMetres(product, {
      ...room,
      ceilingHeightMetres: 2.4,
    });
    const high = calculateIndicativeInfluenceRadiusMetres(product, {
      ...room,
      ceilingHeightMetres: 4,
    });
    expect(high).toBeGreaterThan(low);
  });

  it("intensity decreases with distance", () => {
    expect(relativeIntensityAtDistance(0)).toBeGreaterThan(
      relativeIntensityAtDistance(0.8),
    );
  });

  it("moving luminaire changes sampled intensity", () => {
    const product = DEMO_LIGHTING_PRODUCTS[0]!;
    const dataA = buildHeatmapDataForRoom({
      room,
      luminaires: [
        {
          id: "660e8400-e29b-41d4-a716-446655440030",
          roomId: room.id,
          productId: product.id,
          x: 50,
          y: 50,
          rotationDegrees: 0,
          placementSource: "manual",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      productLookup: (id) =>
        DEMO_LIGHTING_PRODUCTS.find((item) => item.id === id),
      metresPerPixel: 0.1,
    });
    const near = sampleHeatmapIntensityAtPoint({ x: 50, y: 50 }, dataA);
    const far = sampleHeatmapIntensityAtPoint({ x: 90, y: 90 }, dataA);
    expect(near).toBeGreaterThan(far);
  });
});
