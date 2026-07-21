import { z } from "zod";

export const OutputSettingsSchema = z.object({
  projectName: z.string().max(200).optional(),
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
    if (val === null) {
      if (key === "projectName") {
        continue;
      }
      if (
        key === "customerName" ||
        key === "projectReference" ||
        key === "projectAddress" ||
        key === "designerName" ||
        key === "outputDate" ||
        key === "notes"
      ) {
        cleaned[key] = "";
        continue;
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

export function normalizeOutputSettings(
  value: unknown,
  fallbackProjectName?: string,
): OutputSettings {
  const parsed = NormalizedOutputSettingsSchema.parse(value);
  if (!parsed.projectName && fallbackProjectName) {
    return { ...parsed, projectName: fallbackProjectName };
  }
  return parsed;
}

export type OutputSettingsPatch = Partial<OutputSettings>;
