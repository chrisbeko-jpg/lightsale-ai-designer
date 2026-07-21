import {
  assignLuminairePositionNumbers,
  drawLuminaireSymbolOnCanvas,
  getProductDisplayColor,
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
  const { mapPoint } = context;
  const positionMap = new Map(
    assignLuminairePositionNumbers(input.luminaires, input.rooms).map(
      (item) => [item.luminaireId, item.positionNumber],
    ),
  );

  for (const luminaire of input.luminaires) {
    const center = mapPoint({ x: luminaire.x, y: luminaire.y });
    const color = getProductDisplayColor(luminaire.productId);
    drawLuminaireSymbolOnCanvas({
      ctx,
      luminaire,
      centerX: center.x,
      centerY: center.y,
      scale: input.scale,
      fillColor: color,
      strokeColor: "#ffffff",
      lineWidth: 1,
    });

    if (input.settings.showLuminaireNumbers) {
      const number = positionMap.get(luminaire.id);
      if (number !== undefined) {
        ctx.fillStyle = "#2E3135";
        ctx.font = "9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(number), center.x, center.y + 12);
      }
    }
  }
}
