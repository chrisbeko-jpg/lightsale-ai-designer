import type { LightingProduct } from "./product-catalog.js";
import { getProductById } from "./product-catalog.js";
import type { Luminaire, Room, ScaleCalibration } from "./schemas.js";
import { isPointInPolygon } from "./point-in-polygon.js";
import { polygonAreaSquareMetres } from "./area.js";
import { getEffectiveTargetLux } from "./room-lighting.js";
import { calculateEffectiveLumensPerLuminaire } from "./luminaire-quantity.js";

export const INDICATIVE_LUX_DISCLAIMER_NL =
  "Indicatieve lumenmethode. Dit is geen gevalideerde lichttechnische berekening op basis van IES- of LDT-data.";

export const INDICATIVE_LUX_PDF_DISCLAIMER_NL =
  "Dit lichtplan en de weergegeven luxwaarden zijn indicatief en gebaseerd op de lumenmethode. Voor definitieve validatie zijn fotometrische berekeningen met IES- of LDT-bestanden en projectspecifieke reflectiewaarden vereist.";

export type LuxComplianceBand = "green" | "amber" | "red";

export interface LuxComplianceResult {
  indicativeAverageLux: number | null;
  targetLux: number;
  differenceLux: number | null;
  differencePercent: number | null;
  meetsTarget: boolean;
  band: LuxComplianceBand | null;
  meetsTargetLabelNl: string;
}

export function calculateEffectiveLumens(
  product: Pick<LightingProduct, "luminousFluxLumens">,
  utilisationFactor: number,
  maintenanceFactor: number,
): number | null {
  return calculateEffectiveLumensPerLuminaire(
    product.luminousFluxLumens,
    utilisationFactor,
    maintenanceFactor,
  );
}

export function luminairesInsideRoom(
  room: Room,
  luminaires: readonly Luminaire[],
): Luminaire[] {
  return luminaires.filter(
    (item) =>
      item.roomId === room.id &&
      isPointInPolygon({ x: item.x, y: item.y }, room.vertices),
  );
}

export function calculateRoomActualEffectiveLumens(
  room: Room,
  luminaires: readonly Luminaire[],
  productLookup: (productId: string) => LightingProduct | undefined = getProductById,
): number {
  let total = 0;
  for (const luminaire of luminairesInsideRoom(room, luminaires)) {
    const product = productLookup(luminaire.productId);
    if (product === undefined) {
      continue;
    }
    const effective = calculateEffectiveLumens(
      product,
      room.utilisationFactor,
      room.maintenanceFactor,
    );
    if (effective !== null) {
      total += effective;
    }
  }
  return total;
}

export function calculateIndicativeAverageLux(
  room: Room,
  roomAreaSquareMetres: number | null,
  luminaires: readonly Luminaire[],
  productLookup: (productId: string) => LightingProduct | undefined = getProductById,
): number | null {
  if (roomAreaSquareMetres === null || roomAreaSquareMetres <= 0) {
    return null;
  }
  const total = calculateRoomActualEffectiveLumens(room, luminaires, productLookup);
  if (total <= 0) {
    return 0;
  }
  return Math.round(total / roomAreaSquareMetres);
}

export function calculateLuxCompliance(
  indicativeAverageLux: number | null,
  targetLux: number,
): LuxComplianceResult {
  if (indicativeAverageLux === null) {
    return {
      indicativeAverageLux: null,
      targetLux,
      differenceLux: null,
      differencePercent: null,
      meetsTarget: false,
      band: null,
      meetsTargetLabelNl: "Voldoet niet aan ingestelde luxdoelstelling",
    };
  }
  const differenceLux = indicativeAverageLux - targetLux;
  const differencePercent =
    targetLux > 0 ? (indicativeAverageLux / targetLux) * 100 - 100 : null;
  const meetsTarget = indicativeAverageLux >= targetLux;
  let band: LuxComplianceBand;
  if (indicativeAverageLux >= targetLux) {
    band = "green";
  } else if (indicativeAverageLux >= targetLux * 0.9) {
    band = "amber";
  } else {
    band = "red";
  }
  return {
    indicativeAverageLux,
    targetLux,
    differenceLux,
    differencePercent,
    meetsTarget,
    band,
    meetsTargetLabelNl: meetsTarget
      ? "Voldoet aan ingestelde luxdoelstelling"
      : "Voldoet niet aan ingestelde luxdoelstelling",
  };
}

export interface RoomLightingPerformance {
  roomId: string;
  roomName: string;
  areaSquareMetres: number | null;
  targetLux: number;
  placedQuantityInsideRoom: number;
  placedQuantityAssigned: number;
  productIds: string[];
  totalInstalledWattage: number;
  totalEffectiveLumens: number;
  indicativeAverageLux: number | null;
  compliance: LuxComplianceResult;
}

export interface ProjectLightingSummary {
  totalLuminaires: number;
  uniqueProductCount: number;
  totalInstalledWattage: number;
  roomsMeetingTarget: number;
  roomsNotMeetingTarget: number;
  luminairesOutsideAllRooms: number;
  unassignedLuminaireIds: string[];
  rooms: RoomLightingPerformance[];
}

export function countLuminairesOutsideAllRooms(
  rooms: readonly Room[],
  luminaires: readonly Luminaire[],
): { count: number; ids: string[] } {
  const ids: string[] = [];
  for (const luminaire of luminaires) {
    const room = rooms.find((item) => item.id === luminaire.roomId);
    if (room === undefined) {
      ids.push(luminaire.id);
      continue;
    }
    if (!isPointInPolygon({ x: luminaire.x, y: luminaire.y }, room.vertices)) {
      ids.push(luminaire.id);
    }
  }
  return { count: ids.length, ids };
}

export function calculateProjectLightingSummary(input: {
  rooms: readonly Room[];
  luminaires: readonly Luminaire[];
  scale: ScaleCalibration | null;
  productLookup?: (productId: string) => LightingProduct | undefined;
}): ProjectLightingSummary {
  const productLookup = input.productLookup ?? getProductById;
  const roomPerformances: RoomLightingPerformance[] = [];
  let roomsMeeting = 0;
  let roomsNotMeeting = 0;
  const productIds = new Set<string>();

  for (const luminaire of input.luminaires) {
    productIds.add(luminaire.productId);
  }
  const totalWattage = input.luminaires.reduce((sum, item) => {
    const product = productLookup(item.productId);
    return sum + (product?.powerWatts ?? 0);
  }, 0);

  for (const room of input.rooms) {
    const areaM2 =
      input.scale !== null
        ? polygonAreaSquareMetres(room.vertices, input.scale)
        : null;
    const inside = luminairesInsideRoom(room, input.luminaires);
    const assigned = input.luminaires.filter((item) => item.roomId === room.id);
    const roomProductIds = new Set(inside.map((item) => item.productId));
    for (const luminaire of inside) {
      productIds.add(luminaire.productId);
    }
    const totalEffective = calculateRoomActualEffectiveLumens(
      room,
      input.luminaires,
      productLookup,
    );
    const averageLux = calculateIndicativeAverageLux(
      room,
      areaM2,
      input.luminaires,
      productLookup,
    );
    const targetLux = getEffectiveTargetLux(room);
    const compliance = calculateLuxCompliance(averageLux, targetLux);
    if (inside.length > 0) {
      if (compliance.meetsTarget) {
        roomsMeeting += 1;
      } else {
        roomsNotMeeting += 1;
      }
    }
    roomPerformances.push({
      roomId: room.id,
      roomName: room.name,
      areaSquareMetres: areaM2,
      targetLux,
      placedQuantityInsideRoom: inside.length,
      placedQuantityAssigned: assigned.length,
      productIds: [...roomProductIds],
      totalInstalledWattage: inside.reduce((sum, item) => {
        const product = productLookup(item.productId);
        return sum + (product?.powerWatts ?? 0);
      }, 0),
      totalEffectiveLumens: totalEffective,
      indicativeAverageLux: averageLux,
      compliance,
    });
  }

  const outside = countLuminairesOutsideAllRooms(input.rooms, input.luminaires);

  return {
    totalLuminaires: input.luminaires.length,
    uniqueProductCount: productIds.size,
    totalInstalledWattage: totalWattage,
    roomsMeetingTarget: roomsMeeting,
    roomsNotMeetingTarget: roomsNotMeeting,
    luminairesOutsideAllRooms: outside.count,
    unassignedLuminaireIds: outside.ids,
    rooms: roomPerformances,
  };
}
