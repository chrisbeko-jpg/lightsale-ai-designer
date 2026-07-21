import { z } from "zod";

export const DESIGN_LIBRARY_PROJECT_STATUSES = [
  "concept",
  "reviewed",
  "approved_reference",
  "archived",
] as const;

export const DESIGN_LIBRARY_PROJECT_TYPES = [
  "office",
  "residential",
  "retail",
  "hospitality",
  "industrial",
  "education",
  "healthcare",
  "outdoor",
  "other",
] as const;

export const DESIGN_LIBRARY_STYLE_PRESETS = [
  "functional",
  "minimal",
  "architectural",
  "premium",
  "domestic",
  "industrial",
  "hospitality",
  "representative",
  "budget",
] as const;

export const DESIGN_LIBRARY_FILE_CATEGORIES = [
  "lighting_plan",
  "floor_plan",
  "visualization",
  "handover_photo",
  "quote",
  "product_list",
  "calculation",
  "explanation",
  "other",
] as const;

export const DESIGN_LIBRARY_ROOM_TYPES = [
  "open_office",
  "office",
  "executive_office",
  "meeting_room",
  "phone_booth",
  "entrance",
  "reception",
  "corridor",
  "pantry",
  "staff_restaurant",
  "showroom",
  "retail",
  "living_room",
  "kitchen",
  "bedroom",
  "bathroom",
  "warehouse",
  "workshop",
  "outdoor",
  "other",
] as const;

export const DESIGN_LIBRARY_CEILING_TYPES = [
  "suspended_grid",
  "plasterboard",
  "concrete",
  "exposed",
  "wood",
  "sloped",
  "other",
] as const;

export const DESIGN_LIBRARY_PLACEMENT_TYPES = [
  "grid",
  "lines",
  "perimeter",
  "zones",
  "accent_points",
  "free_composition",
  "combination",
] as const;

export const DESIGN_LIBRARY_ALIGNMENT_TYPES = [
  "room_axis",
  "wall_lines",
  "ceiling_grid",
  "furniture",
  "circulation",
  "architecture",
  "free",
] as const;

export const DESIGN_NOTE_CATEGORIES = [
  "product_choice",
  "placement",
  "atmosphere",
  "standards",
  "practice",
  "exception",
  "budget",
  "maintenance",
  "other",
] as const;

export const DESIGN_NOTE_PRIORITIES = [
  "low",
  "normal",
  "high",
  "always_apply",
] as const;

export const DESIGN_NOTE_STATUSES = ["concept", "active", "archived"] as const;

export const DesignLibraryPlacementStrategySchema = z.object({
  placementType: z.enum(DESIGN_LIBRARY_PLACEMENT_TYPES).optional(),
  wallDistanceMetres: z.number().nonnegative().optional(),
  spacingXMetres: z.number().nonnegative().optional(),
  spacingYMetres: z.number().nonnegative().optional(),
  alignment: z.enum(DESIGN_LIBRARY_ALIGNMENT_TYPES).optional(),
  symmetric: z.boolean().optional(),
  followsCeilingGrid: z.boolean().optional(),
  followsArchitecturalLines: z.boolean().optional(),
  avoidsWorkstations: z.boolean().optional(),
  avoidsScreens: z.boolean().optional(),
  accentLightingApplied: z.boolean().optional(),
  placementNotes: z.string().optional(),
});

export const DesignLibraryRoomProductSchema = z.object({
  id: z.string().uuid(),
  catalogProductId: z.string().nullable(),
  isManualHistorical: z.boolean().default(false),
  manualBrand: z.string().optional(),
  manualName: z.string().optional(),
  manualArticleNumber: z.string().optional(),
  manualLumens: z.number().positive().optional(),
  manualWatts: z.number().positive().optional(),
  manualDimensionsLabel: z.string().optional(),
  manualCategory: z.string().optional(),
  quantity: z.number().int().positive().default(1),
  mountingMethod: z.string().optional(),
  color: z.string().optional(),
  dimmingMethod: z.string().optional(),
  notes: z.string().optional(),
});

export const DesignLibraryRoomSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  roomType: z.enum(DESIGN_LIBRARY_ROOM_TYPES).default("other"),
  areaSquareMetres: z.number().positive().optional(),
  lengthMetres: z.number().positive().optional(),
  widthMetres: z.number().positive().optional(),
  ceilingHeightMetres: z.number().positive().optional(),
  ceilingType: z.enum(DESIGN_LIBRARY_CEILING_TYPES).optional(),
  targetLux: z.number().positive().optional(),
  colourTemperatureKelvin: z.number().positive().optional(),
  usageFunction: z.string().optional(),
  style: z.string().optional(),
  budgetLevel: z.string().optional(),
  notes: z.string().optional(),
  placement: DesignLibraryPlacementStrategySchema.optional(),
  roomInterpretation: z.string().optional(),
  products: z.array(DesignLibraryRoomProductSchema).default([]),
});

export const DesignLibraryInterpretationSchema = z.object({
  mainRationale: z.string().optional(),
  designGoal: z.string().optional(),
  functionalRequirements: z.string().optional(),
  aestheticRequirements: z.string().optional(),
  constraints: z.string().optional(),
  deliberateDeviations: z.string().optional(),
  workedWell: z.string().optional(),
  wouldChange: z.string().optional(),
  clientFeedback: z.string().optional(),
  designRulesLearned: z.string().optional(),
});

export const DesignLibraryFileSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  fileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  category: z.enum(DESIGN_LIBRARY_FILE_CATEGORIES).default("other"),
  description: z.string().optional(),
  isPrimary: z.boolean().default(false),
  uploadStatus: z.enum(["pending", "uploaded", "failed"]).default("uploaded"),
  createdAt: z.string(),
});

export const DesignLibraryProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  clientName: z.string().optional(),
  projectNumber: z.string().optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  projectType: z.enum(DESIGN_LIBRARY_PROJECT_TYPES).default("other"),
  location: z.string().optional(),
  designer: z.string().default("Lightsale"),
  styles: z.array(z.enum(DESIGN_LIBRARY_STYLE_PRESETS)).default([]),
  description: z.string().optional(),
  status: z.enum(DESIGN_LIBRARY_PROJECT_STATUSES).default("concept"),
  interpretation: DesignLibraryInterpretationSchema.default({}),
  rooms: z.array(DesignLibraryRoomSchema).default([]),
  searchableText: z.string().optional(),
  normalizedTags: z.array(z.string()).default([]),
  approvalStatus: z.string().optional(),
  referenceQuality: z.string().optional(),
  sourceType: z.string().default("manual"),
  extractionStatus: z.string().default("none"),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
  fileCount: z.number().int().nonnegative().optional(),
  roomCount: z.number().int().nonnegative().optional(),
  files: z.array(DesignLibraryFileSchema).optional(),
});

export const DesignNoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  category: z.enum(DESIGN_NOTE_CATEGORIES).default("other"),
  roomType: z.enum(DESIGN_LIBRARY_ROOM_TYPES).optional(),
  projectType: z.enum(DESIGN_LIBRARY_PROJECT_TYPES).optional(),
  ruleText: z.string().min(1),
  priority: z.enum(DESIGN_NOTE_PRIORITIES).default("normal"),
  status: z.enum(DESIGN_NOTE_STATUSES).default("concept"),
  source: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
});

export type DesignLibraryProject = z.infer<typeof DesignLibraryProjectSchema>;
export type DesignLibraryFile = z.infer<typeof DesignLibraryFileSchema>;
export type DesignLibraryRoom = z.infer<typeof DesignLibraryRoomSchema>;
export type DesignNote = z.infer<typeof DesignNoteSchema>;

export function defaultDesignLibraryInterpretation(): z.infer<
  typeof DesignLibraryInterpretationSchema
> {
  return {};
}

export function normalizeDesignLibraryProjectInput(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const interpretation =
    input.interpretation && typeof input.interpretation === "object"
      ? input.interpretation
      : {};
  return {
    ...input,
    designer: input.designer ?? "Lightsale",
    styles: Array.isArray(input.styles) ? input.styles : [],
    status: input.status ?? "concept",
    interpretation: { ...defaultDesignLibraryInterpretation(), ...interpretation },
    rooms: Array.isArray(input.rooms) ? input.rooms : [],
    sourceType: input.sourceType ?? "manual",
    extractionStatus: input.extractionStatus ?? "none",
  };
}
