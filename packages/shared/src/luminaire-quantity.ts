import type { LightingProduct } from "./product-catalog.js";
import type { Room, RoomType, StylePreset } from "./schemas.js";
import { getEffectiveTargetLux } from "./room-lighting.js";

export function isProductCompatibleWithRoom(
  product: LightingProduct,
  room: Pick<Room, "roomType" | "stylePreset">,
): boolean {
  return (
    product.suitableRoomTypes.includes(room.roomType) &&
    product.suitableStylePresets.includes(room.stylePreset)
  );
}

export function filterCompatibleProducts(
  products: readonly LightingProduct[],
  room: Pick<Room, "roomType" | "stylePreset">,
): LightingProduct[] {
  return products.filter((product) => isProductCompatibleWithRoom(product, room));
}

export function calculateEffectiveLumensPerLuminaire(
  productLuminousFlux: number,
  utilisationFactor: number,
  maintenanceFactor: number,
): number | null {
  if (
    !Number.isFinite(productLuminousFlux) ||
    productLuminousFlux <= 0 ||
    !Number.isFinite(utilisationFactor) ||
    utilisationFactor <= 0 ||
    !Number.isFinite(maintenanceFactor) ||
    maintenanceFactor <= 0
  ) {
    return null;
  }
  return productLuminousFlux * utilisationFactor * maintenanceFactor;
}

export function calculateIndicativeLuminaireQuantity(
  roomAreaSquareMetres: number,
  effectiveTargetLux: number,
  effectiveLumensPerLuminaire: number,
): number | null {
  if (
    !Number.isFinite(roomAreaSquareMetres) ||
    roomAreaSquareMetres <= 0 ||
    !Number.isFinite(effectiveTargetLux) ||
    effectiveTargetLux <= 0 ||
    !Number.isFinite(effectiveLumensPerLuminaire) ||
    effectiveLumensPerLuminaire <= 0
  ) {
    return null;
  }
  const requiredFlux = roomAreaSquareMetres * effectiveTargetLux;
  return Math.ceil(requiredFlux / effectiveLumensPerLuminaire);
}

export function calculateTotalInstalledWatts(
  quantity: number,
  powerWattsPerLuminaire: number,
): number | null {
  if (
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    !Number.isFinite(powerWattsPerLuminaire) ||
    powerWattsPerLuminaire <= 0
  ) {
    return null;
  }
  return quantity * powerWattsPerLuminaire;
}

export interface IndicativeLuminaireEstimateInput {
  roomAreaSquareMetres: number | null;
  room: Pick<
    Room,
    | "roomType"
    | "targetLux"
    | "utilisationFactor"
    | "maintenanceFactor"
    | "selectedProductId"
  >;
  product: LightingProduct | null | undefined;
}

export interface IndicativeLuminaireEstimate {
  effectiveTargetLux: number;
  effectiveLumensPerLuminaire: number | null;
  quantity: number | null;
  totalInstalledWatts: number | null;
}

export function calculateIndicativeLuminaireEstimate(
  input: IndicativeLuminaireEstimateInput,
): IndicativeLuminaireEstimate {
  const effectiveTargetLux = getEffectiveTargetLux(input.room);

  if (input.product === null || input.product === undefined) {
    return {
      effectiveTargetLux,
      effectiveLumensPerLuminaire: null,
      quantity: null,
      totalInstalledWatts: null,
    };
  }

  const effectiveLumensPerLuminaire = calculateEffectiveLumensPerLuminaire(
    input.product.luminousFluxLumens,
    input.room.utilisationFactor,
    input.room.maintenanceFactor,
  );

  const area = input.roomAreaSquareMetres;
  const quantity =
    area !== null && effectiveLumensPerLuminaire !== null
      ? calculateIndicativeLuminaireQuantity(
          area,
          effectiveTargetLux,
          effectiveLumensPerLuminaire,
        )
      : null;

  const totalInstalledWatts =
    quantity !== null
      ? calculateTotalInstalledWatts(quantity, input.product.powerWatts)
      : null;

  return {
    effectiveTargetLux,
    effectiveLumensPerLuminaire,
    quantity,
    totalInstalledWatts,
  };
}

export function selectedProductIdAfterRoomContextChange(
  currentSelectedProductId: string | null,
  product: LightingProduct | undefined,
  room: Pick<Room, "roomType" | "stylePreset">,
): string | null {
  if (currentSelectedProductId === null) {
    return null;
  }
  if (product === undefined) {
    return null;
  }
  if (!isProductCompatibleWithRoom(product, room)) {
    return null;
  }
  return currentSelectedProductId;
}
