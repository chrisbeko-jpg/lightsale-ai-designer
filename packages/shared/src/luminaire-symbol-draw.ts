import type { LightingProduct, ProductCategory } from "./product-catalog.js";
import { getProductById } from "./product-catalog.js";
import type { Luminaire, ScaleCalibration } from "./schemas.js";
import {
  calculateLuminairePlanFootprintPx,
  type LuminairePlanFootprintPx,
} from "./product-dimensions.js";

/** Stroke width in plan pixels at editor zoom = 1 (matches Konva editor). */
export const LUMINAIRE_SYMBOL_STROKE_PLAN_PX = 2;

export const LUMINAIRE_NUMBER_LABEL_GAP_PLAN_PX = 6;

const FALLBACK_RADIUS_PLAN_PX = 5;

export interface LuminaireSymbolMetrics {
  productId: string;
  category: ProductCategory;
  footprint: LuminairePlanFootprintPx;
  isPanel: boolean;
  rotationDegrees: number;
}

export function scaleLuminairePlanFootprint(
  footprint: LuminairePlanFootprintPx,
  factor: number,
): LuminairePlanFootprintPx {
  if (factor === 1) {
    return footprint;
  }
  return {
    shape: footprint.shape,
    radiusPx: footprint.radiusPx * factor,
    halfWidthPx: footprint.halfWidthPx * factor,
    halfHeightPx: footprint.halfHeightPx * factor,
  };
}

export function resolveLuminaireSymbolFootprint(
  luminaire: Luminaire,
  scale: ScaleCalibration | null,
): LuminairePlanFootprintPx {
  const product = getProductById(luminaire.productId);
  return (
    calculateLuminairePlanFootprintPx(product?.dimensions, scale) ?? {
      shape: "circle",
      radiusPx: FALLBACK_RADIUS_PLAN_PX,
      halfWidthPx: FALLBACK_RADIUS_PLAN_PX,
      halfHeightPx: FALLBACK_RADIUS_PLAN_PX,
    }
  );
}

export function resolveLuminaireSymbolMetrics(
  luminaire: Luminaire,
  scale: ScaleCalibration | null,
): LuminaireSymbolMetrics {
  const product = getProductById(luminaire.productId);
  const category = product?.category ?? "downlight";
  const footprint = resolveLuminaireSymbolFootprint(luminaire, scale);
  const isPanel =
    category === "led_panel" ||
    category === "panel" ||
    footprint.shape === "rectangle";
  return {
    productId: luminaire.productId,
    category,
    footprint,
    isPanel,
    rotationDegrees: luminaire.rotationDegrees,
  };
}

export function luminaireNumberLabelOffsetPlanPx(
  footprint: LuminairePlanFootprintPx,
): number {
  const extent =
    footprint.shape === "circle"
      ? footprint.radiusPx
      : Math.max(footprint.halfWidthPx, footprint.halfHeightPx);
  return extent + LUMINAIRE_NUMBER_LABEL_GAP_PLAN_PX;
}

export interface DrawLuminaireSymbolOptions {
  ctx: CanvasRenderingContext2D;
  luminaire: Luminaire;
  centerX: number;
  centerY: number;
  scale: ScaleCalibration | null;
  fillColor: string;
  strokeColor: string;
  /** Stroke width in plan pixels at zoom 1; scaled by planToViewportScale when exporting. */
  lineWidthPlanPx?: number;
  rotationDegrees?: number;
  /** Uniform scale from plan coordinates to target canvas (1 in editor plan space). */
  planToViewportScale?: number;
}

function drawCircleSymbol(
  ctx: CanvasRenderingContext2D,
  footprint: LuminairePlanFootprintPx,
  fill: string,
  stroke: string,
  lineWidth: number,
  innerRing: boolean,
): void {
  const radius = footprint.radiusPx;
  if (radius <= 0) {
    return;
  }
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  if (innerRing) {
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.55, 0, Math.PI * 2);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Math.max(lineWidth * 0.75, 0.5);
    ctx.stroke();
  }
}

function drawTrackSymbol(
  ctx: CanvasRenderingContext2D,
  footprint: LuminairePlanFootprintPx,
  fill: string,
  stroke: string,
  lineWidth: number,
): void {
  drawCircleSymbol(ctx, footprint, fill, stroke, lineWidth, false);
  const r = footprint.radiusPx;
  if (r <= 0) {
    return;
  }
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(r * 0.85, 0);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawRectangleSymbol(
  ctx: CanvasRenderingContext2D,
  footprint: LuminairePlanFootprintPx,
  fill: string,
  stroke: string,
  lineWidth: number,
): void {
  const hw = footprint.halfWidthPx;
  const hh = footprint.halfHeightPx;
  if (hw <= 0 || hh <= 0) {
    return;
  }
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.fillRect(-hw, -hh, hw * 2, hh * 2);
  ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
}

function drawSurfaceSpotSymbol(
  ctx: CanvasRenderingContext2D,
  footprint: LuminairePlanFootprintPx,
  fill: string,
  stroke: string,
  lineWidth: number,
): void {
  const radius = footprint.radiusPx;
  if (radius <= 0) {
    return;
  }
  ctx.save();
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
  ctx.strokeRect(-radius, -radius, radius * 2, radius * 2);
  ctx.restore();
}

function drawLinearSymbol(
  ctx: CanvasRenderingContext2D,
  footprint: LuminairePlanFootprintPx,
  stroke: string,
  lineWidth: number,
): void {
  const half = footprint.radiusPx;
  if (half <= 0) {
    return;
  }
  ctx.beginPath();
  ctx.moveTo(-half * 1.1, 0);
  ctx.lineTo(half * 1.1, 0);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth * 2;
  ctx.lineCap = "round";
  ctx.stroke();
}

export function renderLuminaireSymbol(options: DrawLuminaireSymbolOptions): void {
  const metrics = resolveLuminaireSymbolMetrics(options.luminaire, options.scale);
  const viewportScale = options.planToViewportScale ?? 1;
  const footprint = scaleLuminairePlanFootprint(metrics.footprint, viewportScale);
  const lineWidthPlan = options.lineWidthPlanPx ?? LUMINAIRE_SYMBOL_STROKE_PLAN_PX;
  const lineWidth = lineWidthPlan * viewportScale;
  const rotation = options.rotationDegrees ?? metrics.rotationDegrees;
  const ctx = options.ctx;
  const { category } = metrics;

  ctx.save();
  ctx.translate(options.centerX, options.centerY);
  ctx.rotate((rotation * Math.PI) / 180);

  if (metrics.isPanel) {
    drawRectangleSymbol(
      ctx,
      footprint,
      options.fillColor,
      options.strokeColor,
      lineWidth,
    );
  } else if (category === "tracklighting" || category === "track_spot") {
    drawTrackSymbol(
      ctx,
      footprint,
      options.fillColor,
      options.strokeColor,
      lineWidth,
    );
  } else if (category === "recessed_spot") {
    drawCircleSymbol(
      ctx,
      footprint,
      options.fillColor,
      options.strokeColor,
      lineWidth,
      true,
    );
  } else if (category === "surface_spot") {
    drawSurfaceSpotSymbol(
      ctx,
      footprint,
      options.fillColor,
      options.strokeColor,
      lineWidth,
    );
  } else if (category === "linear") {
    drawLinearSymbol(ctx, footprint, options.fillColor, lineWidth);
  } else {
    drawCircleSymbol(
      ctx,
      footprint,
      options.fillColor,
      options.strokeColor,
      lineWidth,
      false,
    );
  }

  ctx.restore();
}

/** @deprecated Use renderLuminaireSymbol */
export const drawLuminaireSymbolOnCanvas = renderLuminaireSymbol;

export type { LightingProduct };
