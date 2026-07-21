import {
  assignLuminairePositionNumbers,
  getProductDisplayColor,
  luminaireNumberLabelOffsetPlanPx,
  renderLuminaireSymbol,
  resolveLuminaireSymbolFootprint,
} from "@lightsale/shared";
import type { PlanRenderInput, PlanRenderTransformContext } from "./types";

export function renderLuminairesLayer(
  ctx: CanvasRenderingContext2D,
  input: PlanRenderInput,
  context: PlanRenderTransformContext,
): void {
  if (!input.settings.showLuminaireSymbols) {
    return;
  }
  const { mapPoint, transformScale } = context;
  const positionMap = new Map(
    assignLuminairePositionNumbers(input.luminaires, input.rooms).map(
      (item) => [item.luminaireId, item.positionNumber],
    ),
  );

  for (const luminaire of input.luminaires) {
    const center = mapPoint({ x: luminaire.x, y: luminaire.y });
    const color = getProductDisplayColor(luminaire.productId);
    renderLuminaireSymbol({
      ctx,
      luminaire,
      centerX: center.x,
      centerY: center.y,
      scale: input.scale,
      fillColor: color,
      strokeColor: "#ffffff",
      planToViewportScale: transformScale,
    });

    if (input.settings.showLuminaireNumbers) {
      const number = positionMap.get(luminaire.id);
      if (number !== undefined) {
        const footprint = resolveLuminaireSymbolFootprint(luminaire, input.scale);
        const labelY =
          center.y +
          luminaireNumberLabelOffsetPlanPx(footprint) * transformScale;
        ctx.fillStyle = "#2E3135";
        ctx.font = `${10 * transformScale}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(String(number), center.x, labelY);
      }
    }
  }
}
