"use client";

import { useState } from "react";
import type { RoomPropertyPatch, RoomType } from "@lightsale/shared";
import {
  calculateIndicativeLuminaireEstimate,
  calculateRequiredLumens,
  compareRoomLuminaireQuantities,
  countLuminairesForRoom,
  countLuminairesOutsideRoom,
  defaultTargetLuxForRoomType,
  filterCompatibleProducts,
  formatAreaSquareMetres,
  formatRequiredLumens,
  getAllProducts,
  getEffectiveTargetLux,
  getProductById,
  isTargetLuxUnset,
  polygonAreaSquareMetres,
  validateLayoutGeneration,
  validateManualLuminairePlacement,
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
  const selectedLuminaireId = useEditorStore((s) => s.selectedLuminaireId);
  const rooms = useEditorStore((s) => s.rooms);
  const luminaires = useEditorStore((s) => s.luminaires);
  const scale = useEditorStore((s) => s.scale);
  const layoutWallMarginMetres = useEditorStore((s) => s.layoutWallMarginMetres);
  const updateRoomProperties = useEditorStore((s) => s.updateRoomProperties);
  const setLayoutWallMarginMetres = useEditorStore(
    (s) => s.setLayoutWallMarginMetres,
  );
  const generateLightingLayout = useEditorStore((s) => s.generateLightingLayout);
  const regenerateLightingLayout = useEditorStore(
    (s) => s.regenerateLightingLayout,
  );
  const deleteSelectedLuminaire = useEditorStore((s) => s.deleteSelectedLuminaire);
  const duplicateSelectedLuminaire = useEditorStore(
    (s) => s.duplicateSelectedLuminaire,
  );
  const addLuminaireManually = useEditorStore((s) => s.addLuminaireManually);

  const [layoutMessages, setLayoutMessages] = useState<string[]>([]);

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

  const placedCount = countLuminairesForRoom(luminaires, room.id);
  const outsideCount = countLuminairesOutsideRoom(luminaires, room);
  const quantityDifference = compareRoomLuminaireQuantities(
    luminaireEstimate.quantity,
    placedCount,
  );

  const layoutValidation = validateLayoutGeneration({
    scale,
    roomAreaSquareMetres: areaM2,
    room,
    product: selectedProduct,
  });

  const manualValidation = validateManualLuminairePlacement({
    scale,
    room,
    product: selectedProduct,
  });

  const runGenerate = () => {
    const warnings = generateLightingLayout(room.id);
    setLayoutMessages(warnings);
  };

  const runRegenerate = () => {
    const confirmed = window.confirm(
      "Replace all luminaires in this room with a new generated layout?",
    );
    if (!confirmed) {
      return;
    }
    const warnings = regenerateLightingLayout(room.id);
    setLayoutMessages(warnings);
  };

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

      <div className="space-y-2 rounded border border-[var(--border)] bg-[var(--background)] p-3">
        <h4 className="text-xs font-medium text-white">Lighting layout</h4>

        <label className={labelClassName}>
          Wall margin (m)
          <input
            type="number"
            min="0"
            step="0.1"
            value={layoutWallMarginMetres}
            onChange={(event) => {
              const value = parseFloat(event.target.value);
              if (Number.isFinite(value) && value >= 0) {
                setLayoutWallMarginMetres(value);
              }
            }}
            className={fieldClassName}
          />
        </label>

        <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
          <dt className="text-[var(--muted)]">Calculated qty</dt>
          <dd className="text-right font-medium text-white">
            {luminaireEstimate.quantity ?? "—"}
          </dd>
          <dt className="text-[var(--muted)]">Placed</dt>
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
        </dl>

        {outsideCount > 0 ? (
          <p className="text-xs text-red-400">
            {outsideCount} luminaire{outsideCount === 1 ? "" : "s"} outside room
            boundary (adjust position or room shape).
          </p>
        ) : null}

        {layoutValidation.manualPlacementOnly ? (
          <p className="text-xs text-amber-400">Manual placement only for this product category.</p>
        ) : null}

        {!layoutValidation.canGenerate && layoutValidation.reason ? (
          <p className="text-xs text-[var(--muted)]">{layoutValidation.reason}</p>
        ) : null}

        <button
          type="button"
          disabled={!layoutValidation.canGenerate || placedCount > 0}
          onClick={runGenerate}
          className="w-full rounded bg-[var(--accent)] px-3 py-2 text-sm text-white disabled:opacity-40"
        >
          Generate lighting layout
        </button>

        {placedCount > 0 ? (
          <button
            type="button"
            disabled={!layoutValidation.canGenerate}
            onClick={runRegenerate}
            className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm text-white disabled:opacity-40"
          >
            Regenerate layout
          </button>
        ) : null}

        <button
          type="button"
          disabled={!manualValidation.ok}
          onClick={() => addLuminaireManually(room.id)}
          className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm text-white disabled:opacity-40"
        >
          Add luminaire manually
        </button>
        {!manualValidation.ok && manualValidation.reason ? (
          <p className="text-xs text-[var(--muted)]">{manualValidation.reason}</p>
        ) : null}

        {layoutMessages.map((message) => (
          <p key={message} className="text-xs text-amber-400">
            {message}
          </p>
        ))}
      </div>

      {selectedLuminaireId !== null ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => duplicateSelectedLuminaire()}
            className="flex-1 rounded border border-[var(--border)] px-2 py-1.5 text-xs text-white"
          >
            Duplicate luminaire
          </button>
          <button
            type="button"
            onClick={() => deleteSelectedLuminaire()}
            className="flex-1 rounded border border-red-500/60 px-2 py-1.5 text-xs text-red-300"
          >
            Delete luminaire
          </button>
        </div>
      ) : null}
    </div>
  );
}
