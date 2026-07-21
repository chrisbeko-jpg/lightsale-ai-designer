import { describe, expect, it } from "vitest";
import { planImageRectMm } from "./pdf-plan-layout";
import { aspectRatiosMatch } from "@lightsale/shared";

describe("pdf plan layout", () => {
  it("uses identical placement for repeated calls (page 2 and 3 parity)", () => {
    const input = {
      pageWidthMm: 297,
      pageHeightMm: 210,
      sourceWidthPx: 1600,
      sourceHeightPx: 1100,
      margins: { top: 18, right: 14, bottom: 22, left: 14 },
    };
    const a = planImageRectMm(input);
    const b = planImageRectMm(input);
    expect(a).toEqual(b);
  });

  it("preserves aspect ratio for wide and tall sources", () => {
    for (const [w, h] of [
      [2000, 800],
      [800, 2000],
      [1000, 1000],
    ] as const) {
      const rect = planImageRectMm({
        pageWidthMm: 297,
        pageHeightMm: 210,
        sourceWidthPx: w,
        sourceHeightPx: h,
        margins: { top: 18, right: 14, bottom: 22, left: 14 },
      });
      expect(
        aspectRatiosMatch(w, h, rect.width, rect.height, 0.01),
      ).toBe(true);
    }
  });
});
