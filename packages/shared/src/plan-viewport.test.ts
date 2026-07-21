import { describe, expect, it } from "vitest";
import {
  aspectRatiosMatch,
  computeContainTransform,
  planPointToViewport,
  renderedPlanSize,
  resolvePlanSourceDimensions,
} from "./plan-viewport.js";

describe("computeContainTransform", () => {
  it("preserves aspect ratio for landscape source in landscape viewport", () => {
    const transform = computeContainTransform(1600, 900, 800, 450);
    const rendered = renderedPlanSize(transform);
    expect(aspectRatiosMatch(1600, 900, rendered.width, rendered.height)).toBe(
      true,
    );
    expect(rendered.width).toBeLessThanOrEqual(800);
    expect(rendered.height).toBeLessThanOrEqual(450);
  });

  it("preserves aspect ratio for portrait source", () => {
    const transform = computeContainTransform(900, 1600, 500, 500);
    const rendered = renderedPlanSize(transform);
    expect(aspectRatiosMatch(900, 1600, rendered.width, rendered.height)).toBe(
      true,
    );
  });

  it("preserves aspect ratio for wide source", () => {
    const transform = computeContainTransform(3000, 500, 600, 400);
    const rendered = renderedPlanSize(transform);
    expect(aspectRatiosMatch(3000, 500, rendered.width, rendered.height)).toBe(
      true,
    );
  });

  it("uses identical scale for x and y when mapping points", () => {
    const transform = computeContainTransform(1000, 500, 400, 300);
    const a = planPointToViewport({ x: 0, y: 0 }, transform);
    const b = planPointToViewport({ x: 100, y: 0 }, transform);
    const c = planPointToViewport({ x: 0, y: 100 }, transform);
    expect(b.x - a.x).toBeCloseTo(100 * transform.scale);
    expect(c.y - a.y).toBeCloseTo(100 * transform.scale);
  });
});

describe("resolvePlanSourceDimensions", () => {
  it("prefers floor plan pixel dimensions when available", () => {
    const source = resolvePlanSourceDimensions({
      floorPlanWidthPx: 1200,
      floorPlanHeightPx: 800,
      rooms: [],
      luminaires: [],
    });
    expect(source.width).toBe(1200);
    expect(source.height).toBe(800);
  });
});
