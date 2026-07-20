import type {
  Luminaire,
  OutputSettings,
  Room,
  ScaleCalibration,
} from "@lightsale/shared";
import {
  assignLuminairePositionNumbers,
  getProductById,
  getProductDisplayColor,
  metresPerPixel,
  polygonAreaSquareMetres,
  formatAreaSquareMetres,
} from "@lightsale/shared";

export interface PlanRenderInput {
  rooms: readonly Room[];
  luminaires: readonly Luminaire[];
  scale: ScaleCalibration | null;
  settings: OutputSettings;
  floorPlanImage: HTMLImageElement | null;
  pixelWidth: number;
  pixelHeight: number;
}

function contentBounds(
  rooms: readonly Room[],
  luminaires: readonly Luminaire[],
): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const add = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };
  for (const room of rooms) {
    for (const vertex of room.vertices) {
      add(vertex.x, vertex.y);
    }
  }
  for (const luminaire of luminaires) {
    add(luminaire.x, luminaire.y);
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: pixelFallback(), maxY: pixelFallback() };
  }
  return { minX, minY, maxX, maxY };
}

function pixelFallback(): number {
  return 800;
}

export async function renderPlanToDataUrl(
  input: PlanRenderInput,
): Promise<string> {
  const canvas = document.createElement("canvas");
  const width = 1600;
  const height = 1100;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas not supported");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const bounds = contentBounds(input.rooms, input.luminaires);
  const contentW = Math.max(bounds.maxX - bounds.minX, 1);
  const contentH = Math.max(bounds.maxY - bounds.minY, 1);
  const pad = Math.max(contentW, contentH) * 0.08;
  const drawW = width * 0.88;
  const drawH = height * 0.72;
  const scaleFit = Math.min(drawW / (contentW + pad * 2), drawH / (contentH + pad * 2));
  const offsetX = (width - (contentW + pad * 2) * scaleFit) / 2 - (bounds.minX - pad) * scaleFit;
  const offsetY = (height - (contentH + pad * 2) * scaleFit) / 2 - (bounds.minY - pad) * scaleFit;

  const toScreen = (x: number, y: number) => ({
    x: x * scaleFit + offsetX,
    y: y * scaleFit + offsetY,
  });

  if (
    input.settings.showFloorPlanBackground &&
    input.floorPlanImage !== null
  ) {
    const img = input.floorPlanImage;
    const imgW = input.pixelWidth || img.naturalWidth;
    const imgH = input.pixelHeight || img.naturalHeight;
    const topLeft = toScreen(0, 0);
    ctx.drawImage(
      img,
      topLeft.x,
      topLeft.y,
      imgW * scaleFit,
      imgH * scaleFit,
    );
  }

  if (input.settings.showRoomOutlines) {
    for (const room of input.rooms) {
      if (room.vertices.length < 3) {
        continue;
      }
      ctx.beginPath();
      const first = toScreen(room.vertices[0]!.x, room.vertices[0]!.y);
      ctx.moveTo(first.x, first.y);
      for (let index = 1; index < room.vertices.length; index += 1) {
        const point = toScreen(room.vertices[index]!.x, room.vertices[index]!.y);
        ctx.lineTo(point.x, point.y);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(100, 116, 139, 0.15)";
      ctx.fill();
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (input.settings.showRoomNames) {
        const centroid = room.vertices.reduce(
          (acc, vertex) => ({ x: acc.x + vertex.x, y: acc.y + vertex.y }),
          { x: 0, y: 0 },
        );
        const cx = centroid.x / room.vertices.length;
        const cy = centroid.y / room.vertices.length;
        const labelPoint = toScreen(cx, cy);
        ctx.fillStyle = "#1e293b";
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
      const center = toScreen(luminaire.x, luminaire.y);
      const color = getProductDisplayColor(luminaire.productId);
      const radius = 5;
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.stroke();

      if (input.settings.showLuminaireNumbers) {
        const number = positionMap.get(luminaire.id);
        if (number !== undefined) {
          ctx.fillStyle = "#0f172a";
          ctx.font = "9px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(String(number), center.x, center.y + radius + 10);
        }
      }
    }
  }

  if (input.settings.showScale && input.scale !== null) {
    const mpp = metresPerPixel(input.scale);
    const barPx = 100;
    const barMetres = barPx * mpp;
    const barScreen = barPx * scaleFit;
    const x = width * 0.08;
    const y = height * 0.92;
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + barScreen, y);
    ctx.stroke();
    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "left";
    ctx.fillText(`${barMetres.toFixed(1)} m`, x, y - 6);
  }

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
