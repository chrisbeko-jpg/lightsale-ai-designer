import type { OutputSettings } from "./output-settings.js";

const DISALLOWED_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;

export function sanitizePdfProjectSlug(projectName: string): string {
  const trimmed = projectName.trim();
  const base = trimmed || "untitled";
  const slug = base
    .replace(DISALLOWED_FILENAME_CHARS, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug.slice(0, 80) || "untitled";
}

export function buildLightingPlanPdfFilename(projectName: string): string {
  return `${sanitizePdfProjectSlug(projectName)}-lichtplan.pdf`;
}

export interface PdfProjectMetadata {
  projectName: string;
  customerName: string;
  projectReference: string;
  projectAddress: string;
  designerName: string;
  outputDate: string;
  notes: string;
}

export function extractPdfProjectMetadata(
  outputSettings: OutputSettings,
  fallbackProjectName: string,
): PdfProjectMetadata {
  return {
    projectName:
      outputSettings.projectName?.trim() || fallbackProjectName || "Lighting plan",
    customerName: outputSettings.customerName,
    projectReference: outputSettings.projectReference,
    projectAddress: outputSettings.projectAddress,
    designerName: outputSettings.designerName,
    outputDate: outputSettings.outputDate,
    notes: outputSettings.notes,
  };
}

export const PDF_DISCLAIMER =
  "Indicative lighting design. Final lighting performance must be validated using photometric calculations.";
