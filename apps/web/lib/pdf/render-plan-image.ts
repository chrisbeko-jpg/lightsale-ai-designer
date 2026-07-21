import type {

  Luminaire,

  OutputSettings,

  Room,

  RoomHeatmapData,

  ScaleCalibration,

} from "@lightsale/shared";

import {

  computeContainTransform,

  getProductById,

  normalizePointToPlanOrigin,

  planPointToViewport,

  resolvePlanSourceDimensions,

} from "@lightsale/shared";

import { renderFloorPlanLayer } from "../plan-render/floor-plan-renderer";

import { renderHeatmapLayer } from "../plan-render/heatmap-renderer";

import { renderLuminairesLayer } from "../plan-render/luminaire-renderer";

import { renderRoomOutlinesLayer } from "../plan-render/room-renderer";

import { renderScaleBarLayer } from "../plan-render/scale-renderer";

import type {

  PlanRenderInput,

  PlanRenderLayout,

  PlanRenderTransformContext,

} from "../plan-render/types";



export type { PlanRenderInput, PlanRenderLayout };



export function renderPlanCanvas(

  ctx: CanvasRenderingContext2D,

  input: PlanRenderInput,

  layout: PlanRenderLayout,

  options?: { heatmap?: boolean },

): void {

  const { canvasWidth, canvasHeight, planAreaX, planAreaY, planAreaWidth, planAreaHeight } =

    layout;



  ctx.fillStyle = "#ffffff";

  ctx.fillRect(0, 0, canvasWidth, canvasHeight);



  const source = resolvePlanSourceDimensions({

    floorPlanWidthPx:

      input.pixelWidth > 0 ? input.pixelWidth : input.floorPlanImage?.naturalWidth ?? null,

    floorPlanHeightPx:

      input.pixelHeight > 0

        ? input.pixelHeight

        : input.floorPlanImage?.naturalHeight ?? null,

    rooms: input.rooms,

    luminaires: input.luminaires,

  });



  const transform = computeContainTransform(

    source.width,

    source.height,

    planAreaWidth,

    planAreaHeight,

  );

  transform.offsetX += planAreaX;

  transform.offsetY += planAreaY;



  const mapPoint = (point: { x: number; y: number }) => {

    const normalized = normalizePointToPlanOrigin(point, source);

    return planPointToViewport(normalized, transform);

  };



  const renderContext: PlanRenderTransformContext = {

    mapPoint,

    planAreaX,

    planAreaY,

    planAreaWidth,

    planAreaHeight,

    sourceWidth: source.width,

    sourceHeight: source.height,

    transformScale: transform.scale,

  };



  ctx.save();

  ctx.beginPath();

  ctx.rect(planAreaX, planAreaY, planAreaWidth, planAreaHeight);

  ctx.clip();



  const showHeatmap = options?.heatmap === true;



  renderFloorPlanLayer(ctx, input, renderContext);

  if (showHeatmap) {

    renderHeatmapLayer(ctx, input, renderContext);

  }

  renderRoomOutlinesLayer(ctx, input, renderContext);

  renderLuminairesLayer(ctx, input, renderContext);

  renderScaleBarLayer(ctx, input, renderContext);



  ctx.restore();

}



export const STANDARD_PLAN_CANVAS_LAYOUT: PlanRenderLayout = {

  canvasWidth: 1600,

  canvasHeight: 1100,

  planAreaX: 1600 * 0.06,

  planAreaY: 1100 * 0.12,

  planAreaWidth: 1600 * 0.88,

  planAreaHeight: 1100 * 0.78,

};



export async function renderPlanToDataUrl(

  input: PlanRenderInput,

  options?: { layout?: PlanRenderLayout; heatmap?: boolean },

): Promise<string> {

  const layout = options?.layout ?? STANDARD_PLAN_CANVAS_LAYOUT;

  const heatmap = options?.heatmap ?? false;

  const canvas = document.createElement("canvas");

  canvas.width = layout.canvasWidth;

  canvas.height = layout.canvasHeight;

  const ctx = canvas.getContext("2d");

  if (!ctx) {

    throw new Error("Canvas not supported");

  }



  renderPlanCanvas(ctx, input, layout, { heatmap });



  return canvas.toDataURL("image/png");

}



export function loadImageElement(src: string): Promise<HTMLImageElement> {

  return new Promise((resolve, reject) => {

    const image = new Image();

    image.crossOrigin = "anonymous";

    image.onload = () => resolve(image);

    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));

    image.src = src;

  });

}



export async function loadProductThumbnailBase64(

  productId: string,

): Promise<string | null> {

  const product = getProductById(productId);

  if (!product) {

    return null;

  }

  const path = product.imageUrl ?? `/product-thumbnails/${product.category}.svg`;

  try {

    const absolute =

      path.startsWith("http") || path.startsWith("data:")

        ? path

        : `${window.location.origin}${path}`;

    const image = await loadImageElement(absolute);

    const canvas = document.createElement("canvas");

    canvas.width = 64;

    canvas.height = 64;

    const ctx = canvas.getContext("2d");

    if (!ctx) {

      return null;

    }

    ctx.drawImage(image, 0, 0, 64, 64);

    return canvas.toDataURL("image/png");

  } catch {

    return null;

  }

}



export type { RoomHeatmapData };

