"use client";

import { useState } from "react";
import type { OutputSettings } from "@lightsale/shared";
import { useEditorStore } from "@/lib/editor/store";
import {
  downloadPdfBlob,
  exportLightingPlanPdf,
} from "@/lib/pdf/PdfExporter";
import {
  fieldClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
  subsectionTitleClassName,
} from "./editor-form-styles";
import {
  ArticleListPreview,
  ArticleListPreviewHeading,
} from "./ArticleListPreview";
import { Legend } from "./Legend";
import { OutputPreview } from "./OutputPreview";
import { ProjectLuxSummary } from "./ProjectLuxSummary";

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
  const scale = useEditorStore((s) => s.scale);
  const floorPlanUrl = useEditorStore((s) => s.floorPlanUrl);
  const floorPlanSize = useEditorStore((s) => s.floorPlanSize);
  const updateOutputSettings = useEditorStore((s) => s.updateOutputSettings);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const productIds = luminaires.map((item) => item.productId);

  const patch = (updates: Partial<OutputSettings>) => {
    updateOutputSettings(updates);
  };

  const ensureDate = () => {
    if (!outputSettings.outputDate) {
      patch({ outputDate: todayIsoDate() });
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const { filename, blob } = await exportLightingPlanPdf({
        rooms,
        luminaires,
        scale,
        outputSettings,
        projectName,
        floorPlanUrl,
        floorPlanSize,
      });
      downloadPdfBlob(filename, blob);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "PDF export failed",
      );
    } finally {
      setExporting(false);
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
              <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--foreground)]">
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
          <li>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={outputSettings.includeLightIndicatorInPdf}
                onChange={(event) =>
                  patch({ includeLightIndicatorInPdf: event.target.checked })
                }
                className="rounded border-[var(--border)]"
              />
              Include Light Indicator in PDF
            </label>
          </li>
        </ul>
      </div>

      <div className={sectionClassName}>
        <h4 className={subsectionTitleClassName}>Room performance</h4>
        <ProjectLuxSummary
          rooms={rooms}
          luminaires={luminaires}
          scale={scale}
          showLuxSummary={outputSettings.showLuxSummary}
          showComplianceStatus={outputSettings.showComplianceStatus}
        />
      </div>

      <div className={sectionClassName}>
        <h4 className={subsectionTitleClassName}>Legend</h4>
        <Legend productIds={productIds} />
      </div>

      <div className={sectionClassName}>
        <ArticleListPreviewHeading />
        <ArticleListPreview />
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className={secondaryButtonClassName}
        >
          Preview output
        </button>
        <button
          type="button"
          disabled={exporting}
          onClick={() => void handleExportPdf()}
          className={primaryButtonClassName}
        >
          {exporting ? "Generating PDF…" : "Export PDF"}
        </button>
        {exportError ? (
          <p className="text-xs text-[var(--error)]">{exportError}</p>
        ) : null}
      </div>

      {previewOpen ? (
        <OutputPreview
          projectName={projectName}
          outputSettings={outputSettings}
          rooms={rooms}
          luminaires={luminaires}
          scale={scale}
          floorPlanUrl={floorPlanUrl}
          floorPlanSize={floorPlanSize}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
    </div>
  );
}
