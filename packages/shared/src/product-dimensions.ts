import { z } from "zod";
import type { ScaleCalibration } from "./schemas.js";
import { metresPerPixel } from "./scale.js";

export const ProductDimensionsSchema = z.object({
  shape: z.enum(["circle", "rectangle"]),
  diameterMm: z.number().positive().optional(),
  widthMm: z.number().positive().optional(),
  lengthMm: z.number().positive().optional(),
  heightMm: z.number().positive().optional(),
});

export type ProductDimensions = z.infer<typeof ProductDimensionsSchema>;

export interface LuminairePlanFootprintPx {
  shape: "circle" | "rectangle";
  radiusPx: number;
  halfWidthPx: number;
  halfHeightPx: number;
}

export function millimetresToPlanPixels(mm: number, scale: ScaleCalibration): number {
  const mpp = metresPerPixel(scale);
  if (mpp <= 0) {
    return 0;
  }
  return (mm / 1000) / mpp;
}

export function calculateLuminairePlanFootprintPx(
  dimensions: ProductDimensions | undefined,
  scale: ScaleCalibration | null,
): LuminairePlanFootprintPx | null {
  if (scale === null || dimensions === undefined) {
    return null;
  }
  if (dimensions.shape === "circle") {
    const diameterMm = dimensions.diameterMm ?? 200;
    const radiusPx = millimetresToPlanPixels(diameterMm, scale) / 2;
    return {
      shape: "circle",
      radiusPx,
      halfWidthPx: radiusPx,
      halfHeightPx: radiusPx,
    };
  }
  const widthMm = dimensions.widthMm ?? 595;
  const lengthMm = dimensions.lengthMm ?? 595;
  return {
    shape: "rectangle",
    radiusPx: 0,
    halfWidthPx: millimetresToPlanPixels(widthMm, scale) / 2,
    halfHeightPx: millimetresToPlanPixels(lengthMm, scale) / 2,
  };
}

/** Minimum hit target in screen pixels (editor only). */
export const MIN_LUMINAIRE_HIT_RADIUS_SCREEN_PX = 20;

export function hitRadiusPlanPx(
  footprint: LuminairePlanFootprintPx | null,
  zoom: number,
  fallbackPlanRadius: number,
): number {
  const modelRadius =
    footprint?.shape === "circle"
      ? footprint.radiusPx
      : Math.max(footprint?.halfWidthPx ?? fallbackPlanRadius, footprint?.halfHeightPx ?? fallbackPlanRadius);
  const minPlan = MIN_LUMINAIRE_HIT_RADIUS_SCREEN_PX / Math.max(zoom, 0.05);
  return Math.max(modelRadius, minPlan);
}

export function formatProductDimensionsLabel(
  dimensions: ProductDimensions | undefined,
): string | null {
  if (dimensions === undefined) {
    return null;
  }
  if (dimensions.shape === "circle" && dimensions.diameterMm !== undefined) {
    return `Ø ${dimensions.diameterMm} mm`;
  }
  if (
    dimensions.shape === "rectangle" &&
    dimensions.widthMm !== undefined &&
    dimensions.lengthMm !== undefined
  ) {
    return `${dimensions.widthMm} × ${dimensions.lengthMm} mm`;
  }
  return null;
}
