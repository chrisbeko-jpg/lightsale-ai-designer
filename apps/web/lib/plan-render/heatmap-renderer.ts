import {
  buildProjectHeatmapData,
  getProductById,
  metresPerPixel,
} from "@lightsale/shared";
import { drawLightIndicatorHeatmap } from "../heatmap/draw-light-indicator";
import type { PlanRenderInput, PlanRenderTransformContext } from "./types";

export function renderHeatmapLayer(
  ctx: CanvasRenderingContext2D,
  input: PlanRenderInput,
  context: PlanRenderTransformContext,
): void {
  if (input.scale === null) {
    return;
  }
  const { mapPoint, sourceWidth, sourceHeight } = context;
  const layerCanvas = document.createElement("canvas");
  layerCanvas.width = Math.ceil(sourceWidth);
  layerCanvas.height = Math.ceil(sourceHeight);
  const layerCtx = layerCanvas.getContext("2d");
  if (!layerCtx) {
    return;
  }
  const mpp = metresPerPixel(input.scale);
  const roomData = buildProjectHeatmapData({
    rooms: input.rooms,
    luminaires: input.luminaires,
    productLookup: getProductById,
    metresPerPixel: mpp,
  });
  drawLightIndicatorHeatmap(
    layerCtx,
    roomData,
    layerCanvas.width,
    layerCanvas.height,
    6,
  );
  const topLeft = mapPoint({ x: 0, y: 0 });
  const bottomRight = mapPoint({ x: sourceWidth, y: sourceHeight });
  ctx.drawImage(
    layerCanvas,
    topLeft.x,
    topLeft.y,
    bottomRight.x - topLeft.x,
    bottomRight.y - topLeft.y,
  );
}
