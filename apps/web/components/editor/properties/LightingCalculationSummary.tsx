"use client";

import type { Room } from "@lightsale/shared";
import {
  calculateIndicativeLuminaireEstimate,
  calculateRequiredLumens,
  compareRoomLuminaireQuantities,
  countLuminairesForRoom,
  countLuminairesOutsideRoom,
  formatRequiredLumens,
  getEffectiveTargetLux,
  getProductById,
  type Luminaire,
  type LightingProduct,
} from "@lightsale/shared";
import { subsectionTitleClassName } from "./editor-form-styles";

interface LightingCalculationSummaryProps {
  room: Room;
  luminaires: readonly Luminaire[];
  areaM2: number | null;
  selectedProduct: LightingProduct | undefined;
}

export function LightingCalculationSummary({
  room,
  luminaires,
  areaM2,
  selectedProduct,
}: LightingCalculationSummaryProps) {
  const effectiveLux = getEffectiveTargetLux(room);
  const requiredLumens =
    areaM2 !== null ? calculateRequiredLumens(areaM2, effectiveLux) : null;

  const estimate = calculateIndicativeLuminaireEstimate({
    roomAreaSquareMetres: areaM2,
    room,
    product: selectedProduct,
  });

  const placedCount = countLuminairesForRoom(luminaires, room.id);
  const outsideCount = countLuminairesOutsideRoom(luminaires, room);
  const quantityDifference = compareRoomLuminaireQuantities(
    estimate.quantity,
    placedCount,
  );

  const placedWattage = luminaires
    .filter((item) => item.roomId === room.id)
    .reduce((sum, item) => {
      const product = getProductById(item.productId);
      return sum + (product?.powerWatts ?? 0);
    }, 0);

  return (
    <div className="space-y-2 rounded border border-dashed border-[var(--border)] bg-[var(--background)] p-3 text-xs">
      <h4 className={subsectionTitleClassName}>Calculation summary</h4>
      <dl className="grid grid-cols-2 gap-x-2 gap-y-1">
        <dt className="text-[var(--muted)]">Required lumens</dt>
        <dd className="text-right font-medium text-white">
          {requiredLumens !== null
            ? `${formatRequiredLumens(requiredLumens)} lm`
            : "—"}
        </dd>
        <dt className="text-[var(--muted)]">Effective lumens</dt>
        <dd className="text-right font-medium text-white">
          {estimate.effectiveLumensPerLuminaire !== null
            ? `${Math.round(estimate.effectiveLumensPerLuminaire)} lm`
            : "—"}
        </dd>
        <dt className="text-[var(--muted)]">Calculated quantity</dt>
        <dd className="text-right font-medium text-white">
          {estimate.quantity ?? "—"}
        </dd>
        <dt className="text-[var(--muted)]">Placed quantity</dt>
        <dd className="text-right font-medium text-white">{placedCount}</dd>
        <dt className="text-[var(--muted)]">Difference</dt>
        <dd
          className={`text-right font-medium ${
            quantityDifference !== null && quantityDifference !== 0
              ? "text-amber-400"
              : "text-white"
          }`}
        >
          {quantityDifference === null
            ? "—"
            : quantityDifference > 0
              ? `+${quantityDifference}`
              : quantityDifference}
        </dd>
        <dt className="text-[var(--muted)]">Installed wattage</dt>
        <dd className="text-right font-medium text-white">
          {placedCount > 0 ? `${Math.round(placedWattage)} W` : "—"}
        </dd>
        <dt className="text-[var(--muted)]">Outside room</dt>
        <dd
          className={`text-right font-medium ${
            outsideCount > 0 ? "text-red-400" : "text-white"
          }`}
        >
          {outsideCount}
        </dd>
      </dl>
      <p className="text-[var(--muted)]">
        Indicative calculation only. Not a validated lighting calculation.
      </p>
    </div>
  );
}
