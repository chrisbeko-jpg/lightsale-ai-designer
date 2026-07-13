"use client";

import { useState } from "react";
import { useEditorStore } from "@/lib/editor/store";

export function ScaleCalibrationPanel() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const scaleDraftPoints = useEditorStore((s) => s.scaleDraftPoints);
  const applyScale = useEditorStore((s) => s.applyScale);
  const clearScaleDraft = useEditorStore((s) => s.clearScaleDraft);
  const scale = useEditorStore((s) => s.scale);

  const [distance, setDistance] = useState("");

  if (activeTool !== "scale" && scale === null) {
    return null;
  }

  const ready = scaleDraftPoints.length >= 2;

  return (
    <div className="space-y-3 rounded-lg border border-[var(--border)] p-4">
      <h3 className="text-sm font-medium">Scale calibration</h3>
      {scale ? (
        <p className="text-xs text-[var(--muted)]">
          Scale set: {scale.realDistanceMetres} m between two points.
        </p>
      ) : null}
      {activeTool === "scale" ? (
        <>
          <p className="text-xs text-[var(--muted)]">
            Click two points on a known distance ({scaleDraftPoints.length}/2).
          </p>
          <label className="block text-xs text-[var(--muted)]">
            Real distance (metres)
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={distance}
              onChange={(event) => setDistance(event.target.value)}
              className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm text-white"
              placeholder="e.g. 5.0"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!ready || !distance}
              onClick={() => {
                const metres = parseFloat(distance);
                if (Number.isFinite(metres) && metres > 0) {
                  applyScale(metres);
                  setDistance("");
                }
              }}
              className="flex-1 rounded bg-[var(--accent)] py-1.5 text-sm text-white disabled:opacity-40"
            >
              Apply scale
            </button>
            <button
              type="button"
              onClick={() => {
                clearScaleDraft();
                setDistance("");
              }}
              className="rounded border border-[var(--border)] px-3 py-1.5 text-sm"
            >
              Reset
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
