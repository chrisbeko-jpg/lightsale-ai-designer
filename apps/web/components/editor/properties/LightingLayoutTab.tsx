"use client";

import { useState } from "react";
import {
  getProductById,
  polygonAreaSquareMetres,
  validateLayoutGeneration,
  validateManualLuminairePlacement,
} from "@lightsale/shared";
import { useEditorStore } from "@/lib/editor/store";
import { fieldClassName, labelClassName, subsectionTitleClassName } from "./editor-form-styles";
import { ProductSelector } from "./ProductSelector";
import { LightingCalculationSummary } from "./LightingCalculationSummary";
import { SelectedLuminairePanel } from "./SelectedLuminairePanel";

export function LightingLayoutTab() {
  const selectedRoomId = useEditorStore((s) => s.selectedRoomId);
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
  const addLuminaireManually = useEditorStore((s) => s.addLuminaireManually);

  const [layoutMessages, setLayoutMessages] = useState<string[]>([]);

  const room = rooms.find((item) => item.id === selectedRoomId) ?? null;

  if (room === null) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Select a room on the floor plan to configure lighting layout and
        luminaires.
      </p>
    );
  }

  const areaM2 =
    scale !== null ? polygonAreaSquareMetres(room.vertices, scale) : null;
  const selectedProduct =
    room.selectedProductId !== null
      ? getProductById(room.selectedProductId)
      : undefined;

  const placedCount = luminaires.filter((item) => item.roomId === room.id).length;

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

  const patch = (updates: Parameters<typeof updateRoomProperties>[1]) => {
    updateRoomProperties(room.id, updates);
  };

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

  return (
    <div className="space-y-3">
      <ProductSelector
        room={room}
        onPatch={patch}
        prominent={room.selectedProductId === null}
      />

      {selectedProduct ? (
        <LightingCalculationSummary
          room={room}
          luminaires={luminaires}
          areaM2={areaM2}
          selectedProduct={selectedProduct}
        />
      ) : null}

      <div className="space-y-2 rounded border border-[var(--border)] bg-[var(--background)] p-3">
        <h4 className={subsectionTitleClassName}>Placement</h4>

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
            disabled={!selectedProduct}
          />
        </label>

        {layoutValidation.manualPlacementOnly ? (
          <p className="text-xs text-amber-400">
            Manual placement only for this product category.
          </p>
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

      <SelectedLuminairePanel />
    </div>
  );
}
