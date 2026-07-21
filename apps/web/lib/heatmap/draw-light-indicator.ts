import type { RoomHeatmapData } from "@lightsale/shared";
import { relativeIntensityAtDistance } from "@lightsale/shared";

import { intensityColor } from "./heatmap-intensity-colors";

export function drawLightIndicatorHeatmap(
  ctx: CanvasRenderingContext2D,
  roomData: readonly RoomHeatmapData[],
  width: number,
  height: number,
  cellSize = 8,
): void {
  ctx.clearRect(0, 0, width, height);
  for (const room of roomData) {
    if (room.contributions.length === 0) {
      continue;
    }
    ctx.save();
    ctx.beginPath();
    const first = room.vertices[0];
    if (first === undefined) {
      ctx.restore();
      continue;
    }
    ctx.moveTo(first.x, first.y);
    for (let index = 1; index < room.vertices.length; index += 1) {
      const vertex = room.vertices[index]!;
      ctx.lineTo(vertex.x, vertex.y);
    }
    ctx.closePath();
    ctx.clip();

    for (let y = 0; y < height; y += cellSize) {
      for (let x = 0; x < width; x += cellSize) {
        let intensity = 0;
        for (const contribution of room.contributions) {
          const dx = x + cellSize / 2 - contribution.x;
          const dy = y + cellSize / 2 - contribution.y;
          const distance = Math.hypot(dx, dy);
          const normalized = distance / Math.max(contribution.radiusPx, 1);
          intensity +=
            relativeIntensityAtDistance(normalized) * contribution.fluxWeight;
        }
        if (intensity <= 0.02) {
          continue;
        }
        ctx.fillStyle = intensityColor(intensity);
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }
    ctx.restore();
  }
}
