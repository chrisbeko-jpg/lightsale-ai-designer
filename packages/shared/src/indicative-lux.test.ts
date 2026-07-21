import { describe, expect, it } from "vitest";
import {
  calculateIndicativeAverageLux,
  calculateLuxCompliance,
  calculateProjectLightingSummary,
  luminairesInsideRoom,
} from "./indicative-lux.js";
import { DEMO_LIGHTING_PRODUCTS } from "./product-catalog.js";
import type { Luminaire } from "./schemas.js";

const scale = {
  pointA: { x: 0, y: 0 },
  pointB: { x: 100, y: 0 },
  realDistanceMetres: 10,
};

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
  selectedProductId: "demo-downlight-evo-12w",
  utilisationFactor: 0.7,
  maintenanceFactor: 0.8,
};

function luminaire(id: string, x: number, y: number): Luminaire {
  return {
    id,
    roomId: room.id,
    productId: "demo-downlight-evo-12w",
    x,
    y,
    rotationDegrees: 0,
    placementSource: "manual",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("calculateIndicativeAverageLux", () => {
  it("uses placed luminaires and room UF/MF", () => {
    const product = DEMO_LIGHTING_PRODUCTS.find(
      (item) => item.id === "demo-downlight-evo-12w",
    )!;
    const luminaires = Array.from({ length: 8 }, (_, index) =>
      luminaire(`660e8400-e29b-41d4-a716-44665544000${index}`, 20, 20),
    );
    const areaM2 = 100;
    const average = calculateIndicativeAverageLux(room, areaM2, luminaires);
    const expectedEffective =
      8 * product.luminousFluxLumens * 0.7 * 0.8;
    expect(average).toBe(Math.round(expectedEffective / areaM2));
  });

  it("excludes luminaires outside the room polygon", () => {
    const inside = luminaire(
      "660e8400-e29b-41d4-a716-446655440010",
      50,
      50,
    );
    const outside = luminaire(
      "660e8400-e29b-41d4-a716-446655440011",
      500,
      500,
    );
    expect(luminairesInsideRoom(room, [inside, outside])).toHaveLength(1);
    const averageOne = calculateIndicativeAverageLux(room, 100, [inside]);
    const averageTwo = calculateIndicativeAverageLux(room, 100, [inside, outside]);
    expect(averageOne).toBe(averageTwo);
  });
});

describe("calculateLuxCompliance", () => {
  it("meets target when average is sufficient", () => {
    const result = calculateLuxCompliance(520, 500);
    expect(result.meetsTarget).toBe(true);
    expect(result.meetsTargetLabelNl).toContain("Voldoet aan");
  });

  it("does not meet target when average is low", () => {
    const result = calculateLuxCompliance(448, 500);
    expect(result.meetsTarget).toBe(false);
    expect(result.band).toBe("red");
  });

  it("shows amber advisory band between 90% and 99% of target", () => {
    const result = calculateLuxCompliance(475, 500);
    expect(result.meetsTarget).toBe(false);
    expect(result.band).toBe("amber");
  });
});

describe("calculateProjectLightingSummary", () => {
  it("aggregates multiple rooms and products", () => {
    const summary = calculateProjectLightingSummary({
      rooms: [room],
      luminaires: [
        luminaire("660e8400-e29b-41d4-a716-446655440020", 10, 10),
        luminaire("660e8400-e29b-41d4-a716-446655440021", 20, 20),
      ],
      scale,
    });
    expect(summary.totalLuminaires).toBe(2);
    expect(summary.rooms[0]?.placedQuantityInsideRoom).toBe(2);
  });
});
