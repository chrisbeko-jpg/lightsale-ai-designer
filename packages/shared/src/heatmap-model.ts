import type { LightingProduct, ProductCategory } from "./product-catalog.js";
import type { Luminaire, Point, Room } from "./schemas.js";
import { isPointInPolygon } from "./point-in-polygon.js";
import { luminairesInsideRoom } from "./indicative-lux.js";

const DEFAULT_MOUNTING_HEIGHT_METRES = 2.7;
const MIN_INFLUENCE_RADIUS_METRES = 0.35;
const MAX_INFLUENCE_RADIUS_METRES = 4.5;

const FALLBACK_BEAM_ANGLE_DEGREES: Record<ProductCategory, number> = {
  downlight: 60,
  track_spot: 36,
  pendant: 90,
  panel: 110,
  surface_spot: 90,
  linear: 100,
};

export interface HeatmapLuminaireContribution {
  luminaireId: string;
  x: number;
  y: number;
  radiusPx: number;
  fluxWeight: number;
  rotationDegrees: number;
}

export interface RoomHeatmapData {
  roomId: string;
  vertices: readonly Point[];
  contributions: HeatmapLuminaireContribution[];
}

export function resolveBeamAngleDegrees(product: LightingProduct): number {
  if (
    product.beamAngleDegrees !== undefined &&
    Number.isFinite(product.beamAngleDegrees) &&
    product.beamAngleDegrees > 0
  ) {
    return product.beamAngleDegrees;
  }
  return FALLBACK_BEAM_ANGLE_DEGREES[product.category];
}

export function calculateIndicativeInfluenceRadiusMetres(
  product: LightingProduct,
  room: Pick<Room, "ceilingHeightMetres">,
): number {
  const mountingHeight =
    room.ceilingHeightMetres > 0
      ? room.ceilingHeightMetres
      : DEFAULT_MOUNTING_HEIGHT_METRES;
  const beamRadians = (resolveBeamAngleDegrees(product) * Math.PI) / 180 / 2;
  const radius = mountingHeight * Math.tan(beamRadians);
  return Math.min(
    MAX_INFLUENCE_RADIUS_METRES,
    Math.max(MIN_INFLUENCE_RADIUS_METRES, radius),
  );
}

export function calculateIndicativeInfluenceRadiusPx(
  product: LightingProduct,
  room: Pick<Room, "ceilingHeightMetres">,
  metresPerPixel: number,
): number {
  if (metresPerPixel <= 0) {
    return 40;
  }
  return calculateIndicativeInfluenceRadiusMetres(product, room) / metresPerPixel;
}

export function relativeIntensityAtDistance(
  normalizedDistance: number,
  falloffFactor = 2.5,
): number {
  if (normalizedDistance >= 1) {
    return 0;
  }
  return 1 / (1 + falloffFactor * normalizedDistance * normalizedDistance);
}

export function buildHeatmapDataForRoom(input: {
  room: Room;
  luminaires: readonly Luminaire[];
  productLookup: (productId: string) => LightingProduct | undefined;
  metresPerPixel: number;
}): RoomHeatmapData {
  const inside = luminairesInsideRoom(input.room, input.luminaires);
  const contributions: HeatmapLuminaireContribution[] = [];
  for (const luminaire of inside) {
    const product = input.productLookup(luminaire.productId);
    if (product === undefined) {
      continue;
    }
    const radiusPx = calculateIndicativeInfluenceRadiusPx(
      product,
      input.room,
      input.metresPerPixel,
    );
    contributions.push({
      luminaireId: luminaire.id,
      x: luminaire.x,
      y: luminaire.y,
      radiusPx,
      fluxWeight: product.luminousFluxLumens / 1000,
      rotationDegrees: luminaire.rotationDegrees,
    });
  }
  return {
    roomId: input.room.id,
    vertices: input.room.vertices,
    contributions,
  };
}

export function buildProjectHeatmapData(input: {
  rooms: readonly Room[];
  luminaires: readonly Luminaire[];
  productLookup: (productId: string) => LightingProduct | undefined;
  metresPerPixel: number | null;
}): RoomHeatmapData[] {
  if (input.metresPerPixel === null || input.metresPerPixel <= 0) {
    return [];
  }
  const metresPerPixel = input.metresPerPixel;
  return input.rooms.map((room) =>
    buildHeatmapDataForRoom({
      room,
      luminaires: input.luminaires,
      productLookup: input.productLookup,
      metresPerPixel,
    }),
  );
}

export function sampleHeatmapIntensityAtPoint(
  point: Point,
  roomData: RoomHeatmapData,
): number {
  if (!isPointInPolygon(point, roomData.vertices)) {
    return 0;
  }
  let total = 0;
  for (const contribution of roomData.contributions) {
    const dx = point.x - contribution.x;
    const dy = point.y - contribution.y;
    const distance = Math.hypot(dx, dy);
    const normalized = distance / Math.max(contribution.radiusPx, 1);
    total +=
      relativeIntensityAtDistance(normalized) * contribution.fluxWeight;
  }
  return total;
}
