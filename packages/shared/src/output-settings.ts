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
});

export type OutputSettings = z.infer<typeof OutputSettingsSchema>;

export const DEFAULT_OUTPUT_SETTINGS: OutputSettings = OutputSettingsSchema.parse(
  {},
);

export function normalizeOutputSettings(
  value: unknown,
  fallbackProjectName?: string,
): OutputSettings {
  if (value === undefined || value === null) {
    const base = { ...DEFAULT_OUTPUT_SETTINGS };
    if (fallbackProjectName) {
      base.projectName = fallbackProjectName;
    }
    return base;
  }
  const parsed = OutputSettingsSchema.parse(value);
  if (!parsed.projectName && fallbackProjectName) {
    return { ...parsed, projectName: fallbackProjectName };
  }
  return parsed;
}

export type OutputSettingsPatch = Partial<OutputSettings>;
