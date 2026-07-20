import type { LightingProduct } from "./product-catalog.js";
import type { Room, ScaleCalibration } from "./schemas.js";
import { getEffectiveTargetLux } from "./room-lighting.js";
import { calculateIndicativeLuminaireEstimate } from "./luminaire-quantity.js";
import { isRoomGeometryValid } from "./luminaire-room.js";

export interface LayoutGenerationValidationInput {
  scale: ScaleCalibration | null;
  roomAreaSquareMetres: number | null;
  room: Room;
  product: LightingProduct | undefined;
}

export interface LayoutGenerationValidation {
  canGenerate: boolean;
  reason: string | null;
  calculatedQuantity: number | null;
}

export function validateLayoutGeneration(
  input: LayoutGenerationValidationInput,
): LayoutGenerationValidation {
  if (input.scale === null) {
    return {
      canGenerate: false,
      reason: "Configure scale before generating a layout.",
      calculatedQuantity: null,
    };
  }

  if (!isRoomGeometryValid(input.room)) {
    return {
      canGenerate: false,
      reason: "Room geometry is not valid.",
      calculatedQuantity: null,
    };
  }

  if (input.roomAreaSquareMetres === null || input.roomAreaSquareMetres <= 0) {
    return {
      canGenerate: false,
      reason: "Room area is not valid. Check scale and room polygon.",
      calculatedQuantity: null,
    };
  }

  const effectiveLux = getEffectiveTargetLux(input.room);
  if (!Number.isFinite(effectiveLux) || effectiveLux <= 0) {
    return {
      canGenerate: false,
      reason: "Target lux is not available for this room.",
      calculatedQuantity: null,
    };
  }

  if (input.product === undefined) {
    return {
      canGenerate: false,
      reason: "Select a compatible product first.",
      calculatedQuantity: null,
    };
  }

  if (
    !Number.isFinite(input.product.luminousFluxLumens) ||
    input.product.luminousFluxLumens <= 0
  ) {
    return {
      canGenerate: false,
      reason: "Selected product has no usable luminous flux.",
      calculatedQuantity: null,
    };
  }

  const estimate = calculateIndicativeLuminaireEstimate({
    roomAreaSquareMetres: input.roomAreaSquareMetres,
    room: input.room,
    product: input.product,
  });

  if (estimate.quantity === null || estimate.quantity <= 0) {
    return {
      canGenerate: false,
      reason: "Calculated luminaire quantity must be greater than zero.",
      calculatedQuantity: estimate.quantity,
    };
  }

  return {
    canGenerate: true,
    reason: null,
    calculatedQuantity: estimate.quantity,
  };
}

export function validateManualLuminairePlacement(input: {
  scale: ScaleCalibration | null;
  room: Room;
  product: LightingProduct | undefined;
}): { ok: boolean; reason: string | null } {
  if (input.scale === null) {
    return { ok: false, reason: "Configure scale before placing luminaires." };
  }
  if (!isRoomGeometryValid(input.room)) {
    return { ok: false, reason: "Room geometry is not valid." };
  }
  if (input.product === undefined) {
    return { ok: false, reason: "Select a product first." };
  }
  return { ok: true, reason: null };
}
