import { describe, expect, it } from "vitest";
import {
  calculateLuminairePlanFootprintPx,
  millimetresToPlanPixels,
} from "./product-dimensions.js";

const scale = {
  pointA: { x: 0, y: 0 },
  pointB: { x: 100, y: 0 },
  realDistanceMetres: 10,
};

describe("luminaire symbol dimensions", () => {
  it("renders 85mm smaller than 105mm and 200mm circles", () => {
    const small = calculateLuminairePlanFootprintPx(
      { shape: "circle", diameterMm: 85 },
      scale,
    )!;
    const medium = calculateLuminairePlanFootprintPx(
      { shape: "circle", diameterMm: 105 },
      scale,
    )!;
    const large = calculateLuminairePlanFootprintPx(
      { shape: "circle", diameterMm: 200 },
      scale,
    )!;
    expect(small.radiusPx).toBeLessThan(medium.radiusPx);
    expect(medium.radiusPx).toBeLessThan(large.radiusPx);
  });

  it("595 panel is square and 1195x295 is rectangular", () => {
    const square = calculateLuminairePlanFootprintPx(
      { shape: "rectangle", widthMm: 595, lengthMm: 595 },
      scale,
    )!;
    const rect = calculateLuminairePlanFootprintPx(
      { shape: "rectangle", widthMm: 295, lengthMm: 1195 },
      scale,
    )!;
    expect(square.halfWidthPx).toBeCloseTo(square.halfHeightPx, 5);
    expect(rect.halfWidthPx / rect.halfHeightPx).toBeCloseTo(295 / 1195, 2);
  });

  it("scales with calibration", () => {
    const a = millimetresToPlanPixels(1000, scale);
    const tighter = {
      pointA: { x: 0, y: 0 },
      pointB: { x: 200, y: 0 },
      realDistanceMetres: 10,
    };
    const b = millimetresToPlanPixels(1000, tighter);
    expect(b).toBeGreaterThan(a);
  });
});
