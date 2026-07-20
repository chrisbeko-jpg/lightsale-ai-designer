import { describe, expect, it } from "vitest";
import { buildArticleList } from "./article-list.js";
import type { Luminaire, Room } from "./schemas.js";

const roomA: Room = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  name: "Alpha",
  vertices: [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ],
  roomType: "open_office",
  ceilingHeightMetres: 3,
  ceilingType: "exposed",
  targetLux: 300,
  stylePreset: "functional",
  selectedProductId: "demo-downlight-evo-12w",
  utilisationFactor: 0.6,
  maintenanceFactor: 0.8,
};

const roomB: Room = {
  ...roomA,
  id: "550e8400-e29b-41d4-a716-446655440002",
  name: "Beta",
};

function luminaire(
  id: string,
  roomId: string,
  productId: string,
  x: number,
  y: number,
): Luminaire {
  return {
    id,
    roomId,
    productId,
    x,
    y,
    rotationDegrees: 0,
    placementSource: "manual",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("buildArticleList", () => {
  it("returns empty totals for empty project", () => {
    const result = buildArticleList([], [roomA]);
    expect(result.rows).toHaveLength(0);
    expect(result.totalLuminaires).toBe(0);
    expect(result.totalInstalledWattage).toBe(0);
    expect(result.uniqueProductCount).toBe(0);
    expect(result.roomsIncludedCount).toBe(0);
  });

  it("groups by productId using placed quantity", () => {
    const luminaires = [
      luminaire(
        "550e8400-e29b-41d4-a716-446655440010",
        roomA.id,
        "demo-downlight-evo-12w",
        1,
        1,
      ),
      luminaire(
        "550e8400-e29b-41d4-a716-446655440011",
        roomA.id,
        "demo-downlight-evo-12w",
        2,
        2,
      ),
      luminaire(
        "550e8400-e29b-41d4-a716-446655440012",
        roomB.id,
        "demo-surface-spot-18w",
        3,
        3,
      ),
    ];
    const result = buildArticleList(luminaires, [roomA, roomB]);
    expect(result.totalLuminaires).toBe(3);
    expect(result.uniqueProductCount).toBe(2);
    expect(result.roomsIncludedCount).toBe(2);
    const downlight = result.rows.find(
      (row) => row.productId === "demo-downlight-evo-12w",
    );
    expect(downlight?.quantity).toBe(2);
    expect(downlight?.totalWattage).toBe(24);
    expect(result.totalInstalledWattage).toBe(24 + 18);
  });

  it("aggregates multiple rooms using the same product", () => {
    const luminaires = [
      luminaire(
        "550e8400-e29b-41d4-a716-446655440020",
        roomA.id,
        "demo-downlight-evo-12w",
        0,
        0,
      ),
      luminaire(
        "550e8400-e29b-41d4-a716-446655440021",
        roomB.id,
        "demo-downlight-evo-12w",
        1,
        1,
      ),
    ];
    const result = buildArticleList(luminaires, [roomA, roomB]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.quantity).toBe(2);
    expect(result.totalInstalledWattage).toBe(24);
  });
});
