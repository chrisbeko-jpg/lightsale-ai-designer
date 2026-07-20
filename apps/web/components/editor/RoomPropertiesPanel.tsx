"use client";

import type { RoomPropertyPatch, RoomType } from "@lightsale/shared";
import {
  calculateIndicativeLuminaireEstimate,
  calculateRequiredLumens,
  defaultTargetLuxForRoomType,
  filterCompatibleProducts,
  formatAreaSquareMetres,
  formatRequiredLumens,
  getAllProducts,
  getEffectiveTargetLux,
  getProductById,
  isTargetLuxUnset,
  polygonAreaSquareMetres,
} from "@lightsale/shared";
import { useEditorStore } from "@/lib/editor/store";
import {
  ceilingTypeOptions,
  roomTypeOptions,
  stylePresetOptions,
} from "@/lib/room-property-labels";

const fieldClassName =
  "mt-1 w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm text-white outline-none focus:border-[var(--accent)]";

const labelClassName = "block text-xs text-[var(--muted)]";

export function RoomPropertiesPanel() {
  const selectedRoomId = useEditorStore((s) => s.selectedRoomId);
  const rooms = useEditorStore((s) => s.rooms);
  const scale = useEditorStore((s) => s.scale);
  const updateRoomProperties = useEditorStore((s) => s.updateRoomProperties);

  const room = rooms.find((item) => item.id === selectedRoomId) ?? null;

  if (room === null) {
    return null;
  }

  const areaM2 =
    scale !== null ? polygonAreaSquareMetres(room.vertices, scale) : null;

  const areaLabel =
    areaM2 !== null ? formatAreaSquareMetres(areaM2) : null;

  const effectiveLux = getEffectiveTargetLux(room);
  const defaultLux = defaultTargetLuxForRoomType(room.roomType);
  const requiredLumens =
    areaM2 !== null
      ? calculateRequiredLumens(areaM2, effectiveLux)
      : null;

  const compatibleProducts = filterCompatibleProducts(getAllProducts(), room);
  const selectedProduct =
    room.selectedProductId !== null
      ? getProductById(room.selectedProductId)
      : undefined;

  const luminaireEstimate = calculateIndicativeLuminaireEstimate({
    roomAreaSquareMetres: areaM2,
    room,
    product: selectedProduct,
  });

  const patch = (updates: RoomPropertyPatch) => {
    updateRoomProperties(room.id, updates);
  };

  return (
    <div className="space-y-3 rounded-lg border border-[var(--border)] p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">Room properties</h3>
        {areaLabel !== null ? (
          <span className="text-xs text-[var(--muted)]">{areaLabel}</span>
        ) : null}
      </div>

      <label className={labelClassName}>
        Room name
        <input
          type="text"
          value={room.name}
          onChange={(event) => patch({ name: event.target.value })}
          className={fieldClassName}
          maxLength={200}
        />
      </label>

      <label className={labelClassName}>
        Room type
        <select
          value={room.roomType}
          onChange={(event) =>
            patch({ roomType: event.target.value as RoomType })
          }
          className={fieldClassName}
        >
          {roomTypeOptions().map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClassName}>
        Ceiling height (m)
        <input
          type="number"
          min="0.1"
          step="0.1"
          value={room.ceilingHeightMetres}
          onChange={(event) => {
            const metres = parseFloat(event.target.value);
            if (Number.isFinite(metres) && metres > 0) {
              patch({ ceilingHeightMetres: metres });
            }
          }}
          className={fieldClassName}
        />
      </label>

      <label className={labelClassName}>
        Ceiling type
        <select
          value={room.ceilingType}
          onChange={(event) => {
            const option = ceilingTypeOptions().find(
              (item) => item.value === event.target.value,
            );
            if (option) {
              patch({ ceilingType: option.value });
            }
          }}
          className={fieldClassName}
        >
          {ceilingTypeOptions().map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClassName}>
        Target lux
        <input
          type="number"
          min="1"
          step="1"
          placeholder={`Default (${defaultLux})`}
          value={room.targetLux ?? ""}
          onChange={(event) => {
            const raw = event.target.value.trim();
            if (raw === "") {
              patch({ targetLux: null });
              return;
            }
            const lux = parseFloat(raw);
            if (Number.isFinite(lux) && lux > 0) {
              patch({ targetLux: lux });
            }
          }}
          className={fieldClassName}
        />
        {isTargetLuxUnset(room) ? (
          <span className="mt-1 block text-[11px] text-[var(--muted)]">
            Using default for this room type: {defaultLux} lx
          </span>
        ) : null}
      </label>

      <label className={labelClassName}>
        Style preset
        <select
          value={room.stylePreset}
          onChange={(event) => {
            const option = stylePresetOptions().find(
              (item) => item.value === event.target.value,
            );
            if (option) {
              patch({ stylePreset: option.value });
            }
          }}
          className={fieldClassName}
        >
          {stylePresetOptions().map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClassName}>
        Luminaire product
        <select
          value={room.selectedProductId ?? ""}
          onChange={(event) => {
            const value = event.target.value;
            patch({ selectedProductId: value === "" ? null : value });
          }}
          className={fieldClassName}
        >
          <option value="">No product selected</option>
          {compatibleProducts.map((product) => (
            <option key={product.id} value={product.id}>
              {product.brand} — {product.name}
            </option>
          ))}
        </select>
        {compatibleProducts.length === 0 ? (
          <span className="mt-1 block text-[11px] text-[var(--muted)]">
            No compatible products for this room type and style.
          </span>
        ) : null}
      </label>

      {selectedProduct ? (
        <p className="text-xs text-[var(--muted)]">
          {selectedProduct.luminousFluxLumens.toLocaleString("en-GB")} lm ·{" "}
          {selectedProduct.powerWatts} W
          {selectedProduct.articleNumber
            ? ` · ${selectedProduct.articleNumber}`
            : ""}
        </p>
      ) : null}

      <label className={labelClassName}>
        Utilisation factor
        <input
          type="number"
          min="0.01"
          max="1"
          step="0.01"
          value={room.utilisationFactor}
          onChange={(event) => {
            const factor = parseFloat(event.target.value);
            if (Number.isFinite(factor) && factor > 0 && factor <= 1) {
              patch({ utilisationFactor: factor });
            }
          }}
          className={fieldClassName}
        />
      </label>

      <label className={labelClassName}>
        Maintenance factor
        <input
          type="number"
          min="0.01"
          max="1"
          step="0.01"
          value={room.maintenanceFactor}
          onChange={(event) => {
            const factor = parseFloat(event.target.value);
            if (Number.isFinite(factor) && factor > 0 && factor <= 1) {
              patch({ maintenanceFactor: factor });
            }
          }}
          className={fieldClassName}
        />
      </label>

      <div className="rounded border border-dashed border-[var(--border)] bg-[var(--background)] p-3 text-xs">
        {requiredLumens !== null ? (
          <p className="text-[var(--foreground)]">
            Indicative required light output:{" "}
            <span className="font-medium">
              {formatRequiredLumens(requiredLumens)} lumen
            </span>
          </p>
        ) : (
          <p className="text-[var(--muted)]">
            Set scale and room area to estimate indicative light output.
          </p>
        )}
        {luminaireEstimate.quantity !== null ? (
          <p className="mt-2 text-[var(--foreground)]">
            Indicative quantity:{" "}
            <span className="font-medium">
              {luminaireEstimate.quantity} luminaires
            </span>
          </p>
        ) : null}
        {luminaireEstimate.totalInstalledWatts !== null ? (
          <p className="mt-1 text-[var(--foreground)]">
            Total installed wattage:{" "}
            <span className="font-medium">
              {Math.round(luminaireEstimate.totalInstalledWatts)} W
            </span>
          </p>
        ) : null}
        <p className="mt-2 text-[var(--muted)]">
          Indicative calculation only. Not a validated lighting calculation.
        </p>
      </div>
    </div>
  );
}
