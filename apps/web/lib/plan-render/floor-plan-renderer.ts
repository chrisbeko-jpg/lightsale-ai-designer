import type { PlanRenderInput, PlanRenderTransformContext } from "./types";

export function renderFloorPlanLayer(
  ctx: CanvasRenderingContext2D,
  input: PlanRenderInput,
  context: PlanRenderTransformContext,
): void {
  if (!input.settings.showFloorPlanBackground || input.floorPlanImage === null) {
    return;
  }
  const { mapPoint, sourceWidth, sourceHeight } = context;
  const topLeft = mapPoint({ x: 0, y: 0 });
  const bottomRight = mapPoint({ x: sourceWidth, y: sourceHeight });
  ctx.drawImage(
    input.floorPlanImage,
    topLeft.x,
    topLeft.y,
    bottomRight.x - topLeft.x,
    bottomRight.y - topLeft.y,
  );
}
