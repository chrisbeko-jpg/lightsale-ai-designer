import { z } from "zod";

/** Keep in sync with backend/app/document_normalize.py OUTPUT_SETTINGS_TEXT_FIELDS */
export const OUTPUT_SETTINGS_TEXT_FIELDS = [
  "projectName",
  "customerName",
  "projectReference",
  "projectAddress",
  "designerName",
  "outputDate",
  "notes",
] as const;

export type OutputSettingsTextField = (typeof OUTPUT_SETTINGS_TEXT_FIELDS)[number];

export const OutputSettingsSchema = z.object({
  projectName: z.string().max(200).default(""),
  customerName: z.string().max(200).default(""),
  projectReference: z.string().max(200).default(""),
  projectAddress: z.string().max(500).default(""),
  designerName: z.string().max(200).default(""),
  outputDate: z.string().max(50).default(""),
  notes: z.string().max(2000).default(""),
  showFloorPlanBackground: z.boolean().default(true),
  showRoomOutlines: z.boolean().default(true),
  showRoomNames: z.boolean().default(true),
  showLuminaireSymbols: z.boolean().default(true),
  showLuminaireNumbers: z.boolean().default(false),
  showScale: z.boolean().default(true),
  showLegend: z.boolean().default(true),
  showLightIndicator: z.boolean().default(false),
  includeLightIndicatorInPdf: z.boolean().default(false),
  showLuxSummary: z.boolean().default(true),
  showComplianceStatus: z.boolean().default(true),
});

export type OutputSettings = z.infer<typeof OutputSettingsSchema>;

export const DEFAULT_OUTPUT_SETTINGS: OutputSettings =
  OutputSettingsSchema.parse({});

function outputSettingsPreprocessInput(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) {
    return {};
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const record = value as Record<string, unknown>;
  const cleaned: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(record)) {
    if (val === null || val === undefined) {
      if (
        OUTPUT_SETTINGS_TEXT_FIELDS.includes(key as OutputSettingsTextField)
      ) {
        cleaned[key] = "";
      }
      continue;
    }
    cleaned[key] = val;
  }
  return cleaned;
}

/** Accepts null, missing keys (via parent), partial objects; always parses to full OutputSettings. */
export const NormalizedOutputSettingsSchema = z.preprocess(
  outputSettingsPreprocessInput,
  OutputSettingsSchema,
);

export interface NormalizeOutputSettingsProject {
  name?: string;
}

/**
 * Single entry point for outputSettings normalization (load, API parse, saves).
 * Never returns null text fields; fills projectName from project.name when empty.
 */
export function normalizeOutputSettings(
  value: unknown,
  project?: NormalizeOutputSettingsProject | string,
): OutputSettings {
  const fallbackProjectName =
    typeof project === "string" ? project : project?.name?.trim();

  const parsed = NormalizedOutputSettingsSchema.parse(value);
  const projectName = parsed.projectName.trim();
  if (projectName.length > 0) {
    return { ...parsed, projectName };
  }
  if (fallbackProjectName) {
    return { ...parsed, projectName: fallbackProjectName };
  }
  return { ...parsed, projectName: "" };
}

export type OutputSettingsPatch = Partial<OutputSettings>;
