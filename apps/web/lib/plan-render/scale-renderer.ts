import { metresPerPixel } from "@lightsale/shared";
import type { PlanRenderInput, PlanRenderTransformContext } from "./types";

export function renderScaleBarLayer(
  ctx: CanvasRenderingContext2D,
  input: PlanRenderInput,
  context: PlanRenderTransformContext,
): void {
  if (!input.settings.showScale || input.scale === null) {
    return;
  }
  const mpp = metresPerPixel(input.scale);
  const barPx = 100;
  const barMetres = barPx * mpp;
  const barScreen = barPx * context.transformScale;
  const x = context.planAreaX + 16;
  const y = context.planAreaY + context.planAreaHeight - 16;
  ctx.strokeStyle = "#2E3135";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + barScreen, y);
  ctx.stroke();
  ctx.font = "11px sans-serif";
  ctx.fillStyle = "#2E3135";
  ctx.textAlign = "left";
  ctx.fillText(`${barMetres.toFixed(1)} m`, x, y - 6);
}
