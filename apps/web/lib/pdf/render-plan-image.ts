import type {
  Luminaire,
  OutputSettings,
  Room,
  RoomHeatmapData,
  ScaleCalibration,
} from "@lightsale/shared";
import {
  assignLuminairePositionNumbers,
  buildProjectHeatmapData,
  computeContainTransform,
  getProductById,
  getProductDisplayColor,
  drawLuminaireSymbolOnCanvas,
  metresPerPixel,
  normalizePointToPlanOrigin,
  planPointToViewport,
  polygonAreaSquareMetres,
  formatAreaSquareMetres,
  resolvePlanSourceDimensions,
} from "@lightsale/shared";
import { drawLightIndicatorHeatmap } from "../heatmap/draw-light-indicator";

export interface PlanRenderInput {
  rooms: readonly Room[];
  luminaires: readonly Luminaire[];
  scale: ScaleCalibration | null;
  settings: OutputSettings;
  floorPlanImage: HTMLImageElement | null;
  pixelWidth: number;
  pixelHeight: number;
}

export interface PlanRenderLayout {
  canvasWidth: number;
  canvasHeight: number;
  planAreaX: number;
  planAreaY: number;
  planAreaWidth: number;
  planAreaHeight: number;
}

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

  ctx.save();
  ctx.beginPath();
  ctx.rect(planAreaX, planAreaY, planAreaWidth, planAreaHeight);
  ctx.clip();

  const showHeatmap =
    options?.heatmap ??
    (input.settings.includeLightIndicatorInPdf || input.settings.showLightIndicator);

  if (input.settings.showFloorPlanBackground && input.floorPlanImage !== null) {
    const topLeft = mapPoint({ x: 0, y: 0 });
    const bottomRight = mapPoint({ x: source.width, y: source.height });
    ctx.drawImage(
      input.floorPlanImage,
      topLeft.x,
      topLeft.y,
      bottomRight.x - topLeft.x,
      bottomRight.y - topLeft.y,
    );
  }

  if (showHeatmap && input.scale !== null) {
    const layerCanvas = document.createElement("canvas");
    layerCanvas.width = Math.ceil(source.width);
    layerCanvas.height = Math.ceil(source.height);
    const layerCtx = layerCanvas.getContext("2d");
    if (layerCtx) {
      const mpp = metresPerPixel(input.scale);
      const roomData = buildProjectHeatmapData({
        rooms: input.rooms,
        luminaires: input.luminaires,
        productLookup: getProductById,
        metresPerPixel: mpp,
      });
      drawLightIndicatorHeatmap(
        layerCtx,
        roomData,
        layerCanvas.width,
        layerCanvas.height,
        6,
      );
      const topLeft = mapPoint({ x: 0, y: 0 });
      const bottomRight = mapPoint({ x: source.width, y: source.height });
      ctx.drawImage(
        layerCanvas,
        topLeft.x,
        topLeft.y,
        bottomRight.x - topLeft.x,
        bottomRight.y - topLeft.y,
      );
    }
  }

  if (input.settings.showRoomOutlines) {
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
      ctx.fillStyle = "rgba(107, 114, 128, 0.12)";
      ctx.fill();
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

  const positionMap = new Map(
    assignLuminairePositionNumbers(input.luminaires, input.rooms).map(
      (item) => [item.luminaireId, item.positionNumber],
    ),
  );

  if (input.settings.showLuminaireSymbols) {
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

  if (input.settings.showScale && input.scale !== null) {
    const mpp = metresPerPixel(input.scale);
    const barPx = 100;
    const barMetres = barPx * mpp;
    const barScreen = barPx * transform.scale;
    const x = planAreaX + 16;
    const y = planAreaY + planAreaHeight - 16;
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