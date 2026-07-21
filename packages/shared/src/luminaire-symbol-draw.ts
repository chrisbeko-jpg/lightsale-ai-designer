import type { LightingProduct } from "./product-catalog.js";
import { getProductById } from "./product-catalog.js";
import type { Luminaire, ScaleCalibration } from "./schemas.js";
import {
  calculateLuminairePlanFootprintPx,
  type LuminairePlanFootprintPx,
} from "./product-dimensions.js";

export interface DrawLuminaireSymbolOptions {
  ctx: CanvasRenderingContext2D;
  luminaire: Luminaire;
  centerX: number;
  centerY: number;
  scale: ScaleCalibration | null;
  fillColor: string;
  strokeColor: string;
  lineWidth?: number;
  rotationDegrees?: number;
}

const FALLBACK_RADIUS_PX = 5;

function drawCircleSymbol(
  ctx: CanvasRenderingContext2D,
  footprint: LuminairePlanFootprintPx,
  fill: string,
  stroke: string,
  lineWidth: number,
  innerRing: boolean,
): void {
  const radius = Math.max(footprint.radiusPx, 1);
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
    ctx.lineWidth = Math.max(1, lineWidth * 0.75);
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
  const r = Math.max(footprint.radiusPx, 1);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(r * 0.9, 0);
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
  const hw = Math.max(footprint.halfWidthPx, 1);
  const hh = Math.max(footprint.halfHeightPx, 1);
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.fillRect(-hw, -hh, hw * 2, hh * 2);
  ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
}

export function drawLuminaireSymbolOnCanvas(
  options: DrawLuminaireSymbolOptions,
): void {
  const product = getProductById(options.luminaire.productId);
  const footprint =
    calculateLuminairePlanFootprintPx(product?.dimensions, options.scale) ??
    ({
      shape: "circle",
      radiusPx: FALLBACK_RADIUS_PX,
      halfWidthPx: FALLBACK_RADIUS_PX,
      halfHeightPx: FALLBACK_RADIUS_PX,
    } satisfies LuminairePlanFootprintPx);

  const category = product?.category ?? "downlight";
  const lineWidth = options.lineWidth ?? 1.5;
  const rotation = options.rotationDegrees ?? options.luminaire.rotationDegrees;
  const ctx = options.ctx;

  ctx.save();
  ctx.translate(options.centerX, options.centerY);
  ctx.rotate((rotation * Math.PI) / 180);

  if (
    category === "led_panel" ||
    category === "panel" ||
    footprint.shape === "rectangle"
  ) {
    drawRectangleSymbol(
      ctx,
      footprint,
      options.fillColor,
      options.strokeColor,
      lineWidth,
    );
  } else if (
    category === "tracklighting" ||
    category === "track_spot"
  ) {
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

export type { LightingProduct };
