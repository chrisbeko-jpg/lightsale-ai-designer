import { describe, expect, it } from "vitest";
import { screenToCanvas } from "@lightsale/shared";
import {
  isScreenPointOverCanvasHost,
  screenPointToCanvas,
} from "./canvas-coords";

describe("canvas-coords", () => {
  const rect = { left: 100, top: 50, width: 800, height: 600 };
  const viewport = { zoom: 2, offsetX: 10, offsetY: 20 };

  it("detects pointer over canvas host", () => {
    expect(isScreenPointOverCanvasHost(200, 200, rect)).toBe(true);
    expect(isScreenPointOverCanvasHost(50, 200, rect)).toBe(false);
  });

  it("converts screen to canvas with zoom and pan", () => {
    const point = screenPointToCanvas(110, 70, rect, viewport);
    const expected = screenToCanvas({ x: 10, y: 20 }, viewport);
    expect(point.x).toBeCloseTo(expected.x);
    expect(point.y).toBeCloseTo(expected.y);
  });
});
