import { describe, expect, it } from "vitest";
import { calculateFloorplanPdfTransform } from "./pdf-floorplan-transform.js";
import { aspectRatiosMatch } from "./plan-viewport.js";

describe("calculateFloorplanPdfTransform", () => {
  it("uses contain fit without distortion", () => {
    const wide = calculateFloorplanPdfTransform({
      sourceWidth: 2000,
      sourceHeight: 800,
      availableWidth: 400,
      availableHeight: 300,
    });
    const tall = calculateFloorplanPdfTransform({
      sourceWidth: 800,
      sourceHeight: 2000,
      availableWidth: 400,
      availableHeight: 300,
    });
    expect(wide.renderWidth).toBeLessThanOrEqual(400);
    expect(wide.renderHeight).toBeLessThanOrEqual(300);
    expect(tall.renderWidth).toBeLessThanOrEqual(400);
    expect(tall.renderHeight).toBeLessThanOrEqual(300);
    expect(
      aspectRatiosMatch(2000, 800, wide.renderWidth, wide.renderHeight),
    ).toBe(true);
    expect(
      aspectRatiosMatch(800, 2000, tall.renderWidth, tall.renderHeight),
    ).toBe(true);
  });

  it("returns identical transform for same inputs (page 2 and 3 parity)", () => {
    const input = {
      sourceWidth: 1600,
      sourceHeight: 900,
      availableWidth: 250,
      availableHeight: 180,
    };
    const a = calculateFloorplanPdfTransform(input);
    const b = calculateFloorplanPdfTransform(input);
    expect(a).toEqual(b);
  });
});
