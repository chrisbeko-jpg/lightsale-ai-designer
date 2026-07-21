import { describe, expect, it, vi } from "vitest";
import {
  renderLuminaireSymbol,
  resolveLuminaireSymbolFootprint,
  scaleLuminairePlanFootprint,
} from "./luminaire-symbol-draw.js";

const scale = {
  pointA: { x: 0, y: 0 },
  pointB: { x: 100, y: 0 },
  realDistanceMetres: 10,
};

const panelLuminaire = {
  id: "lum-1",
  roomId: "550e8400-e29b-41d4-a716-446655440000",
  productId: "wl-spark-595",
  x: 50,
  y: 50,
  rotationDegrees: 0,
  placementSource: "manual" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("renderLuminaireSymbol", () => {
  it("scales symbol geometry only by planToViewportScale (same as plan transform)", () => {
    const footprint = resolveLuminaireSymbolFootprint(panelLuminaire, scale);
    const atOne = scaleLuminairePlanFootprint(footprint, 1);
    const atTwo = scaleLuminairePlanFootprint(footprint, 2);
    expect(atTwo.halfWidthPx).toBeCloseTo(atOne.halfWidthPx * 2, 5);
    expect(atTwo.halfHeightPx).toBeCloseTo(atOne.halfHeightPx * 2, 5);
  });

  it("draws panel bounds matching scaled footprint (no extra PDF multiplier)", () => {
    const footprint = resolveLuminaireSymbolFootprint(panelLuminaire, scale);
    const viewportScale = 0.45;
    const scaled = scaleLuminairePlanFootprint(footprint, viewportScale);

    const fillRect = vi.fn();
    const strokeRect = vi.fn();
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      fillRect,
      strokeRect,
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
    } as unknown as CanvasRenderingContext2D;

    renderLuminaireSymbol({
      ctx,
      luminaire: panelLuminaire,
      centerX: 100,
      centerY: 200,
      scale,
      fillColor: "#000",
      strokeColor: "#fff",
      planToViewportScale: viewportScale,
    });

    expect(fillRect).toHaveBeenCalledWith(
      -scaled.halfWidthPx,
      -scaled.halfHeightPx,
      scaled.halfWidthPx * 2,
      scaled.halfHeightPx * 2,
    );
  });

  it("uses identical plan footprint for editor and export at viewport scale 1", () => {
    const downlight = {
      ...panelLuminaire,
      productId: "wl-bari-small",
    };
    const editorFootprint = resolveLuminaireSymbolFootprint(downlight, scale);
    const exportFootprint = scaleLuminairePlanFootprint(
      resolveLuminaireSymbolFootprint(downlight, scale),
      1,
    );
    expect(exportFootprint.radiusPx).toBe(editorFootprint.radiusPx);
  });
});
