import type { LightingProduct } from "./product-catalog.js";
import {
  isManualPlacementOnlyCategory,
  supportsAutomaticGridPlacement,
} from "./grid-placement.js";
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
  manualPlacementOnly: boolean;
}

export function validateLayoutGeneration(
  input: LayoutGenerationValidationInput,
): LayoutGenerationValidation {
  if (input.scale === null) {
    return {
      canGenerate: false,
      reason: "Configure scale before generating a layout.",
      calculatedQuantity: null,
      manualPlacementOnly: false,
    };
  }

  if (!isRoomGeometryValid(input.room)) {
    return {
      canGenerate: false,
      reason: "Room geometry is not valid.",
      calculatedQuantity: null,
      manualPlacementOnly: false,
    };
  }

  if (input.roomAreaSquareMetres === null || input.roomAreaSquareMetres <= 0) {
    return {
      canGenerate: false,
      reason: "Room area is not valid. Check scale and room polygon.",
      calculatedQuantity: null,
      manualPlacementOnly: false,
    };
  }

  const effectiveLux = getEffectiveTargetLux(input.room);
  if (!Number.isFinite(effectiveLux) || effectiveLux <= 0) {
    return {
      canGenerate: false,
      reason: "Target lux is not available for this room.",
      calculatedQuantity: null,
      manualPlacementOnly: false,
    };
  }

  if (input.product === undefined) {
    return {
      canGenerate: false,
      reason: "Select a compatible product first.",
      calculatedQuantity: null,
      manualPlacementOnly: false,
    };
  }

  if (isManualPlacementOnlyCategory(input.product.category)) {
    return {
      canGenerate: false,
      reason: "Manual placement only for this product category.",
      calculatedQuantity: null,
      manualPlacementOnly: true,
    };
  }

  if (!supportsAutomaticGridPlacement(input.product.category)) {
    return {
      canGenerate: false,
      reason: "Automatic grid placement is not supported for this product.",
      calculatedQuantity: null,
      manualPlacementOnly: false,
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
      manualPlacementOnly: false,
    };
  }

  return {
    canGenerate: true,
    reason: null,
    calculatedQuantity: estimate.quantity,
    manualPlacementOnly: false,
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
