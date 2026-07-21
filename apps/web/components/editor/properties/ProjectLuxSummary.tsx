"use client";

import {
  calculateProjectLightingSummary,
  formatAreaSquareMetres,
  getProductById,
  INDICATIVE_LUX_DISCLAIMER_NL,
  type Luminaire,
  type Room,
  type ScaleCalibration,
} from "@lightsale/shared";
import { roomTypeLabel } from "@/lib/room-property-labels";
import { subsectionTitleClassName } from "./editor-form-styles";

interface ProjectLuxSummaryProps {
  rooms: readonly Room[];
  luminaires: readonly Luminaire[];
  scale: ScaleCalibration | null;
  showLuxSummary?: boolean;
  showComplianceStatus?: boolean;
}

function bandClass(band: "green" | "amber" | "red" | null): string {
  if (band === "green") {
    return "border-l-[var(--success)]";
  }
  if (band === "amber") {
    return "border-l-[var(--warning)]";
  }
  if (band === "red") {
    return "border-l-[var(--error)]";
  }
  return "border-l-[var(--border)]";
}

export function ProjectLuxSummary({
  rooms,
  luminaires,
  scale,
  showLuxSummary = true,
  showComplianceStatus = true,
}: ProjectLuxSummaryProps) {
  if (!showLuxSummary) {
    return null;
  }

  const summary = calculateProjectLightingSummary({ rooms, luminaires, scale });
  const roomsWithLights = summary.rooms.filter(
    (room) => room.placedQuantityInsideRoom > 0,
  );

  return (
    <div className="space-y-3">
      <div className="rounded border border-[var(--border)] bg-white p-3">
        <h4 className={subsectionTitleClassName}>Project lighting summary</h4>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <dt className="text-[var(--muted)]">Total luminaires</dt>
          <dd className="text-right font-medium text-[var(--foreground)]">
            {summary.totalLuminaires}
          </dd>
          <dt className="text-[var(--muted)]">Unique products</dt>
          <dd className="text-right font-medium text-[var(--foreground)]">
            {summary.uniqueProductCount}
          </dd>
          <dt className="text-[var(--muted)]">Total installed wattage</dt>
          <dd className="text-right font-medium text-[var(--foreground)]">
            {Math.round(summary.totalInstalledWattage)} W
          </dd>
          <dt className="text-[var(--muted)]">Rooms meeting target</dt>
          <dd className="text-right font-medium text-[var(--foreground)]">
            {summary.roomsMeetingTarget}
          </dd>
          <dt className="text-[var(--muted)]">Rooms not meeting target</dt>
          <dd className="text-right font-medium text-[var(--foreground)]">
            {summary.roomsNotMeetingTarget}
          </dd>
          <dt className="text-[var(--muted)]">Outside all rooms</dt>
          <dd
            className={`text-right font-medium ${
              summary.luminairesOutsideAllRooms > 0
                ? "text-[var(--error)]"
                : "text-[var(--foreground)]"
            }`}
          >
            {summary.luminairesOutsideAllRooms}
          </dd>
        </dl>
      </div>

      {roomsWithLights.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">No luminaires placed in rooms.</p>
      ) : (
        <ul className="space-y-2">
          {roomsWithLights.map((room) => {
            const productLabels = room.productIds
              .map((id) => {
                const product = getProductById(id);
                return product ? `${product.brand} — ${product.name}` : id;
              })
              .join("; ");
            const compliance = room.compliance;
            return (
              <li
                key={room.roomId}
                className={`rounded border border-[var(--border)] border-l-4 bg-white p-3 ${bandClass(
                  showComplianceStatus ? compliance.band : null,
                )}`}
              >
                <p className="text-sm font-medium text-[var(--charcoal)]">
                  {room.roomName}
                </p>
                <p className="text-[10px] text-[var(--muted)]">
                  {roomTypeLabel(
                    rooms.find((item) => item.id === room.roomId)?.roomType ??
                      "other",
                  )}
                  {room.areaSquareMetres !== null
                    ? ` · ${formatAreaSquareMetres(room.areaSquareMetres)}`
                    : ""}
                </p>
                <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                  <dt className="text-[var(--muted)]">Ingestelde doelwaarde</dt>
                  <dd className="text-right">{room.targetLux} lux</dd>
                  <dt className="text-[var(--muted)]">Geplaatst (in ruimte)</dt>
                  <dd className="text-right">{room.placedQuantityInsideRoom}</dd>
                  <dt className="text-[var(--muted)]">Product(en)</dt>
                  <dd className="text-right text-[10px]">{productLabels || "—"}</dd>
                  <dt className="text-[var(--muted)]">Totaal wattage</dt>
                  <dd className="text-right">
                    {Math.round(room.totalInstalledWattage)} W
                  </dd>
                  <dt className="text-[var(--muted)]">Effectieve lumen</dt>
                  <dd className="text-right">
                    {Math.round(room.totalEffectiveLumens)} lm
                  </dd>
                  <dt className="text-[var(--muted)]">Indicatieve gemiddelde</dt>
                  <dd className="text-right font-medium">
                    {room.indicativeAverageLux ?? "—"} lux
                  </dd>
                  {showComplianceStatus ? (
                    <>
                      <dt className="text-[var(--muted)]">Verschil</dt>
                      <dd className="text-right">
                        {compliance.differenceLux !== null
                          ? `${compliance.differenceLux >= 0 ? "+" : ""}${compliance.differenceLux} lux`
                          : "—"}
                        {compliance.differencePercent !== null
                          ? ` (${compliance.differencePercent >= 0 ? "+" : ""}${compliance.differencePercent.toFixed(0)}%)`
                          : ""}
                      </dd>
                      <dt className="text-[var(--muted)]">Resultaat</dt>
                      <dd className="text-right font-medium">
                        {compliance.meetsTarget ? "voldoet" : "voldoet niet"}
                      </dd>
                    </>
                  ) : null}
                </dl>
                {showComplianceStatus ? (
                  <p className="mt-2 text-[10px] text-[var(--muted)]">
                    {compliance.meetsTargetLabelNl}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[10px] leading-snug text-[var(--muted)]">
        {INDICATIVE_LUX_DISCLAIMER_NL}
      </p>
    </div>
  );
}
