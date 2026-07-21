/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { normalizeLoadedProjectDocument } from "@lightsale/shared";
import { renderRoomOutlinesLayer } from "./room-renderer";
import type { PlanRenderTransformContext } from "./types";

const renderHeatmapLayerMock = vi.fn();

vi.mock("./heatmap-renderer", () => ({
  renderHeatmapLayer: (...args: unknown[]) => renderHeatmapLayerMock(...args),
}));

describe("plan room renderer", () => {
  it("strokes room outlines without filling", () => {
    const ctx = {
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    const mapPoint = (p: { x: number; y: number }) => ({ x: p.x, y: p.y });
    const context: PlanRenderTransformContext = {
      mapPoint,
      planAreaX: 0,
      planAreaY: 0,
      planAreaWidth: 100,
      planAreaHeight: 100,
      sourceWidth: 100,
      sourceHeight: 100,
      transformScale: 1,
    };

    const settings = normalizeLoadedProjectDocument({}).outputSettings;
    renderRoomOutlinesLayer(
      ctx,
      {
        rooms: [
          {
            id: "r1",
            name: "Room",
            vertices: [
              { x: 0, y: 0 },
              { x: 10, y: 0 },
              { x: 10, y: 10 },
            ],
            roomType: "other",
            ceilingHeightMetres: 3,
            ceilingType: "exposed",
            targetLux: 100,
            stylePreset: "functional",
            selectedProductId: null,
            utilisationFactor: 0.6,
            maintenanceFactor: 0.8,
          },
        ],
        luminaires: [],
        scale: null,
        settings: { ...settings, showRoomNames: false },
        floorPlanImage: null,
        pixelWidth: 100,
        pixelHeight: 100,
      },
      context,
    );

    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx.fill).not.toHaveBeenCalled();
  });
});

describe("renderPlanCanvas heatmap option", () => {
  beforeEach(() => {
    renderHeatmapLayerMock.mockClear();
  });

  it("only enables heatmap when options.heatmap is strictly true", async () => {
    const { renderPlanCanvas, STANDARD_PLAN_CANVAS_LAYOUT } = await import(
      "../pdf/render-plan-image"
    );

    const ctx = {
      fillStyle: "",
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      font: "",
      textAlign: "left",
      fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    const input = {
      rooms: [],
      luminaires: [],
      scale: {
        pointA: { x: 0, y: 0 },
        pointB: { x: 100, y: 0 },
        realDistanceMetres: 10,
      },
      settings: {
        ...normalizeLoadedProjectDocument({}).outputSettings,
        showScale: false,
        showLightIndicator: true,
        includeLightIndicatorInPdf: true,
      },
      floorPlanImage: null,
      pixelWidth: 100,
      pixelHeight: 100,
    };

    renderPlanCanvas(ctx, input, STANDARD_PLAN_CANVAS_LAYOUT, { heatmap: false });
    expect(renderHeatmapLayerMock).not.toHaveBeenCalled();

    renderPlanCanvas(ctx, input, STANDARD_PLAN_CANVAS_LAYOUT, { heatmap: true });
    expect(renderHeatmapLayerMock).toHaveBeenCalled();
  });
});
