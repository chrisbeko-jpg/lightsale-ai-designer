import { describe, expect, it } from "vitest";
import { polygonAreaPixels, polygonAreaSquareMetres } from "./area.js";
import {
  metresPerPixel,
  pixelDistance,
  pixelsToMetres,
} from "./scale.js";
import type { Point, ScaleCalibration } from "./schemas.js";

describe("pixelDistance", () => {
  it("returns zero for identical points", () => {
    expect(pixelDistance({ x: 10, y: 20 }, { x: 10, y: 20 })).toBe(0);
  });

  it("returns horizontal distance", () => {
    expect(pixelDistance({ x: 0, y: 0 }, { x: 100, y: 0 })).toBe(100);
  });

  it("returns diagonal distance", () => {
    expect(pixelDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe("metresPerPixel", () => {
  it("derives scale from two points and real distance", () => {
    const calibration: ScaleCalibration = {
      pointA: { x: 0, y: 0 },
      pointB: { x: 100, y: 0 },
      realDistanceMetres: 5,
    };
    expect(metresPerPixel(calibration)).toBeCloseTo(0.05);
  });

  it("throws when calibration points are identical", () => {
    const calibration: ScaleCalibration = {
      pointA: { x: 5, y: 5 },
      pointB: { x: 5, y: 5 },
      realDistanceMetres: 3,
    };
    expect(() => metresPerPixel(calibration)).toThrow(
      "Calibration points must not be identical",
    );
  });
});

describe("pixelsToMetres", () => {
  it("converts pixel length using calibration", () => {
    const calibration: ScaleCalibration = {
      pointA: { x: 0, y: 0 },
      pointB: { x: 200, y: 0 },
      realDistanceMetres: 10,
    };
    expect(pixelsToMetres(200, calibration)).toBeCloseTo(10);
  });
});

describe("polygonAreaPixels", () => {
  it("returns zero for fewer than three vertices", () => {
    expect(polygonAreaPixels([])).toBe(0);
    expect(polygonAreaPixels([{ x: 0, y: 0 }])).toBe(0);
    expect(
      polygonAreaPixels([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ]),
    ).toBe(0);
  });

  it("calculates area of a 10x10 square", () => {
    const square: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(polygonAreaPixels(square)).toBe(100);
  });

  it("calculates area regardless of winding order", () => {
    const cw: Point[] = [
      { x: 0, y: 0 },
      { x: 0, y: 20 },
      { x: 30, y: 20 },
      { x: 30, y: 0 },
    ];
    const ccw: Point[] = [...cw].reverse();
    expect(polygonAreaPixels(cw)).toBe(600);
    expect(polygonAreaPixels(ccw)).toBe(600);
  });
});

describe("polygonAreaSquareMetres", () => {
  it("converts pixel area to square metres", () => {
    const calibration: ScaleCalibration = {
      pointA: { x: 0, y: 0 },
      pointB: { x: 100, y: 0 },
      realDistanceMetres: 10,
    };
    const square: Point[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    expect(polygonAreaSquareMetres(square, calibration)).toBeCloseTo(100);
  });
});
