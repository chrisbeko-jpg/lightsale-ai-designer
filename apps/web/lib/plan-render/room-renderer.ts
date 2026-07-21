import {
  formatAreaSquareMetres,
  polygonAreaSquareMetres,
} from "@lightsale/shared";
import type { PlanRenderInput, PlanRenderTransformContext } from "./types";

/** Outline and labels only — no room fill (output/PDF). */
export function renderRoomOutlinesLayer(
  ctx: CanvasRenderingContext2D,
  input: PlanRenderInput,
  context: PlanRenderTransformContext,
): void {
  if (!input.settings.showRoomOutlines) {
    return;
  }
  const { mapPoint } = context;
  for (const room of input.rooms) {
    if (room.vertices.length < 3) {
      continue;
    }
    ctx.beginPath();
    const first = mapPoint(room.vertices[0]!);
    ctx.moveTo(first.x, first.y);
    for (let index = 1; index < room.vertices.length; index += 1) {
      const point = mapPoint(room.vertices[index]!);
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.strokeStyle = "#6B7280";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (input.settings.showRoomNames) {
      const centroid = room.vertices.reduce(
        (acc, vertex) => ({ x: acc.x + vertex.x, y: acc.y + vertex.y }),
        { x: 0, y: 0 },
      );
      const cx = centroid.x / room.vertices.length;
      const cy = centroid.y / room.vertices.length;
      const labelPoint = mapPoint({ x: cx, y: cy });
      ctx.fillStyle = "#2E3135";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      const areaLabel =
        input.scale !== null
          ? formatAreaSquareMetres(
              polygonAreaSquareMetres(room.vertices, input.scale),
            )
          : "";
      ctx.fillText(room.name, labelPoint.x, labelPoint.y);
      if (areaLabel) {
        ctx.fillText(areaLabel, labelPoint.x, labelPoint.y + 14);
      }
    }
  }
}
