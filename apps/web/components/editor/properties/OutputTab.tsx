"use client";

import { useState } from "react";
import type { OutputSettings } from "@lightsale/shared";
import { useEditorStore } from "@/lib/editor/store";
import {
  fieldClassName,
  labelClassName,
  sectionClassName,
  subsectionTitleClassName,
} from "./editor-form-styles";
import {
  ArticleListPreview,
  ArticleListPreviewHeading,
} from "./ArticleListPreview";
import { OutputPreview } from "./OutputPreview";

type DrawingOptionKey =
  | "showFloorPlanBackground"
  | "showRoomOutlines"
  | "showRoomNames"
  | "showLuminaireSymbols"
  | "showLuminaireNumbers"
  | "showScale"
  | "showLegend";

const DRAWING_OPTIONS: { key: DrawingOptionKey; label: string }[] = [
  { key: "showFloorPlanBackground", label: "Show floor plan background" },
  { key: "showRoomOutlines", label: "Show room outlines" },
  { key: "showRoomNames", label: "Show room names" },
  { key: "showLuminaireSymbols", label: "Show luminaire symbols" },
  { key: "showLuminaireNumbers", label: "Show luminaire numbers" },
  { key: "showScale", label: "Show scale" },
  { key: "showLegend", label: "Show legend" },
];

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function OutputTab() {
  const outputSettings = useEditorStore((s) => s.outputSettings);
  const projectName = useEditorStore((s) => s.projectName);
  const rooms = useEditorStore((s) => s.rooms);
  const luminaires = useEditorStore((s) => s.luminaires);
  const updateOutputSettings = useEditorStore((s) => s.updateOutputSettings);

  const [previewOpen, setPreviewOpen] = useState(false);

  const patch = (updates: Partial<OutputSettings>) => {
    updateOutputSettings(updates);
  };

  const ensureDate = () => {
    if (!outputSettings.outputDate) {
      patch({ outputDate: todayIsoDate() });
    }
  };

  return (
    <div className="space-y-4">
      <div className={sectionClassName}>
        <h4 className={subsectionTitleClassName}>Project information</h4>
        <label className={labelClassName}>
          Project name
          <input
            type="text"
            value={outputSettings.projectName ?? projectName}
            onChange={(event) => patch({ projectName: event.target.value })}
            className={fieldClassName}
            maxLength={200}
          />
        </label>
        <label className={labelClassName}>
          Customer name
          <input
            type="text"
            value={outputSettings.customerName}
            onChange={(event) => patch({ customerName: event.target.value })}
            className={fieldClassName}
            maxLength={200}
          />
        </label>
        <label className={labelClassName}>
          Project reference
          <input
            type="text"
            value={outputSettings.projectReference}
            onChange={(event) =>
              patch({ projectReference: event.target.value })
            }
            className={fieldClassName}
            maxLength={200}
          />
        </label>
        <label className={labelClassName}>
          Project address
          <textarea
            value={outputSettings.projectAddress}
            onChange={(event) => patch({ projectAddress: event.target.value })}
            className={`${fieldClassName} min-h-[4rem] resize-y`}
            maxLength={500}
            rows={2}
          />
        </label>
        <label className={labelClassName}>
          Designer name
          <input
            type="text"
            value={outputSettings.designerName}
            onChange={(event) => patch({ designerName: event.target.value })}
            className={fieldClassName}
            maxLength={200}
          />
        </label>
        <label className={labelClassName}>
          Date
          <input
            type="date"
            value={outputSettings.outputDate || todayIsoDate()}
            onFocus={ensureDate}
            onChange={(event) => patch({ outputDate: event.target.value })}
            className={fieldClassName}
          />
        </label>
        <label className={labelClassName}>
          Notes
          <textarea
            value={outputSettings.notes}
            onChange={(event) => patch({ notes: event.target.value })}
            className={`${fieldClassName} min-h-[4rem] resize-y`}
            maxLength={2000}
            rows={3}
          />
        </label>
      </div>

      <div className={sectionClassName}>
        <h4 className={subsectionTitleClassName}>Drawing options</h4>
        <ul className="space-y-2">
          {DRAWING_OPTIONS.map((option) => (
            <li key={option.key}>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-white">
                <input
                  type="checkbox"
                  checked={outputSettings[option.key]}
                  onChange={(event) =>
                    patch({ [option.key]: event.target.checked })
                  }
                  className="rounded border-[var(--border)]"
                />
                {option.label}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className={sectionClassName}>
        <ArticleListPreviewHeading />
        <ArticleListPreview />
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm text-white hover:border-[var(--accent)]"
        >
          Preview output
        </button>
        <button
          type="button"
          disabled
          title="PDF export will be available in the next release"
          className="w-full rounded bg-[var(--accent)] px-3 py-2 text-sm text-white opacity-50"
        >
          Export PDF — coming next
        </button>
      </div>

      {previewOpen ? (
        <OutputPreview
          projectName={projectName}
          outputSettings={outputSettings}
          rooms={rooms}
          luminaires={luminaires}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
    </div>
  );
}
