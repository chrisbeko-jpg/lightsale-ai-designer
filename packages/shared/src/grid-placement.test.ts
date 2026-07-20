import { describe, expect, it } from "vitest";
import {
  chooseGridDimensions,
  compareRoomLuminaireQuantities,
  countLuminairesForRoom,
  generateGridPlacementPoints,
  generateSymmetricGridPoints,
  selectGridPointsForQuantity,
} from "./grid-placement.js";
import { isPointInPolygon } from "./point-in-polygon.js";
import { normalizeLoadedProjectDocument } from "./document-normalization.js";

describe("chooseGridDimensions", () => {
  it("chooses near-square grid for a square area", () => {
    expect(chooseGridDimensions(9, 10, 10)).toEqual({ rows: 3, cols: 3 });
  });

  it("uses at least the requested quantity of cells", () => {
    const { rows, cols } = chooseGridDimensions(10, 20, 10);
    expect(rows * cols).toBeGreaterThanOrEqual(10);
  });
});

describe("generateSymmetricGridPoints", () => {
  it("centres points within inset bounds", () => {
    const points = generateSymmetricGridPoints(0, 0, 100, 100, 2, 2);
    expect(points).toHaveLength(4);
    expect(points[0]).toEqual({ x: 25, y: 25 });
    expect(points[3]).toEqual({ x: 75, y: 75 });
  });
});

describe("selectGridPointsForQuantity", () => {
  it("prefers centre-out symmetric subset", () => {
    const points = generateSymmetricGridPoints(0, 0, 100, 100, 3, 3);
    const selected = selectGridPointsForQuantity(points, 5, { x: 50, y: 50 });
    expect(selected).toHaveLength(5);
    expect(selected.some((p) => p.x === 50 && p.y === 50)).toBe(true);
  });
});

describe("generateGridPlacementPoints", () => {
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

  it("places only points inside the polygon", () => {
    const result = generateGridPlacementPoints({
      room: squareRoom,
      scale,
      quantity: 4,
      wallMarginMetres: 0.6,
    });
    expect(result.placedCount).toBe(4);
    for (const point of result.points) {
      expect(isPointInPolygon(point, squareRoom.vertices)).toBe(true);
    }
  });

  it("reduces wall margin when inset is too tight", () => {
    const narrowRoom = {
      ...squareRoom,
      vertices: [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 100 },
        { x: 0, y: 100 },
      ],
    };
    const result = generateGridPlacementPoints({
      room: narrowRoom,
      scale,
      quantity: 6,
      wallMarginMetres: 2,
    });
    expect(result.wallMarginMetresUsed).toBeLessThan(2);
    for (const point of result.points) {
      expect(isPointInPolygon(point, narrowRoom.vertices)).toBe(true);
    }
  });

  it("converts wall margin metres to pixels via scale", () => {
    const tightMargin = generateGridPlacementPoints({
      room: squareRoom,
      scale,
      quantity: 4,
      wallMarginMetres: 0.6,
    });
    const looseMargin = generateGridPlacementPoints({
      room: squareRoom,
      scale,
      quantity: 4,
      wallMarginMetres: 0,
    });
    expect(tightMargin.points[0]?.x).toBeGreaterThan(looseMargin.points[0]?.x ?? 0);
  });

  it("warns when quantity cannot be fully placed", () => {
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
    const result = generateGridPlacementPoints({
      room: lShapeRoom,
      scale,
      quantity: 80,
      wallMarginMetres: 0.6,
    });
    expect(result.placedCount).toBeLessThan(80);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe("room quantity comparison", () => {
  it("counts luminaires per room", () => {
    const items = [
      { roomId: "a" },
      { roomId: "a" },
      { roomId: "b" },
    ];
    expect(countLuminairesForRoom(items, "a")).toBe(2);
  });

  it("returns placed minus calculated difference", () => {
    expect(compareRoomLuminaireQuantities(10, 8)).toBe(-2);
    expect(compareRoomLuminaireQuantities(10, 10)).toBe(0);
  });
});

describe("normalizeLoadedProjectDocument", () => {
  it("defaults missing luminaires to empty array", () => {
    const doc = normalizeLoadedProjectDocument({
      scale: null,
      rooms: [],
    });
    expect(doc.luminaires).toEqual([]);
  });

  it("preserves luminaire collection at project level", () => {
    const doc = normalizeLoadedProjectDocument({
      scale: null,
      rooms: [],
      luminaires: [
        {
          id: "660e8400-e29b-41d4-a716-446655440001",
          roomId: "550e8400-e29b-41d4-a716-446655440000",
          productId: "demo-downlight-evo-12w",
          x: 10,
          y: 20,
          rotationDegrees: 0,
          placementSource: "generated",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    expect(doc.luminaires).toHaveLength(1);
    expect(doc.luminaires[0]?.x).toBe(10);
  });
});
