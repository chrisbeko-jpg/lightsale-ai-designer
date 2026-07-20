import { z } from "zod";
import { DEMO_PRODUCT_IDS, getProductById } from "./product-catalog.js";
import { migrateLegacyRoomFields } from "./room-migration.js";

export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export type Point = z.infer<typeof PointSchema>;

export const ScaleCalibrationSchema = z.object({
  pointA: PointSchema,
  pointB: PointSchema,
  realDistanceMetres: z.number().positive(),
});

export type ScaleCalibration = z.infer<typeof ScaleCalibrationSchema>;

export const ROOM_TYPES = [
  "living_room",
  "kitchen",
  "dining_room",
  "bedroom",
  "bathroom",
  "hallway",
  "home_office",
  "open_office",
  "private_office",
  "meeting_room",
  "reception",
  "corridor",
  "storage",
  "toilet",
  "technical_room",
  "other",
] as const;

export const RoomTypeSchema = z.enum(ROOM_TYPES);
export type RoomType = z.infer<typeof RoomTypeSchema>;

export const CEILING_TYPES = [
  "suspended",
  "exposed",
  "grid",
  "sloped",
  "other",
] as const;

export const CeilingTypeSchema = z.enum(CEILING_TYPES);
export type CeilingType = z.infer<typeof CeilingTypeSchema>;

export const STYLE_PRESETS = [
  "functional",
  "warm_modern",
  "minimal",
  "hotel_chic",
  "industrial",
  "architectural",
  "custom",
] as const;

export const StylePresetSchema = z.enum(STYLE_PRESETS);
export type StylePreset = z.infer<typeof StylePresetSchema>;

export const DEFAULT_ROOM_PROPERTY_VALUES = {
  roomType: "other",
  ceilingHeightMetres: 3,
  ceilingType: "exposed",
  targetLux: null,
  stylePreset: "functional",
  selectedProductId: null,
  utilisationFactor: 0.6,
  maintenanceFactor: 0.8,
} as const satisfies {
  roomType: RoomType;
  ceilingHeightMetres: number;
  ceilingType: CeilingType;
  targetLux: number | null;
  stylePreset: StylePreset;
  selectedProductId: string | null;
  utilisationFactor: number;
  maintenanceFactor: number;
};

export const RoomSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  vertices: z.array(PointSchema).min(3),
  roomType: RoomTypeSchema.default(DEFAULT_ROOM_PROPERTY_VALUES.roomType),
  ceilingHeightMetres: z
    .number()
    .positive()
    .default(DEFAULT_ROOM_PROPERTY_VALUES.ceilingHeightMetres),
  ceilingType: CeilingTypeSchema.default(DEFAULT_ROOM_PROPERTY_VALUES.ceilingType),
  targetLux: z
    .number()
    .positive()
    .nullable()
    .default(DEFAULT_ROOM_PROPERTY_VALUES.targetLux),
  stylePreset: StylePresetSchema.default(DEFAULT_ROOM_PROPERTY_VALUES.stylePreset),
  selectedProductId: z
    .string()
    .min(1)
    .nullable()
    .default(DEFAULT_ROOM_PROPERTY_VALUES.selectedProductId),
  utilisationFactor: z
    .number()
    .positive()
    .max(1)
    .default(DEFAULT_ROOM_PROPERTY_VALUES.utilisationFactor),
  maintenanceFactor: z
    .number()
    .positive()
    .max(1)
    .default(DEFAULT_ROOM_PROPERTY_VALUES.maintenanceFactor),
});

export type Room = z.infer<typeof RoomSchema>;

export type RoomPropertyPatch = Partial<
  Pick<
    Room,
    | "name"
    | "roomType"
    | "ceilingHeightMetres"
    | "ceilingType"
    | "targetLux"
    | "stylePreset"
    | "selectedProductId"
    | "utilisationFactor"
    | "maintenanceFactor"
  >
>;

function sanitizeRoomProductSelection(room: Room): Room {
  if (room.selectedProductId === null) {
    return room;
  }
  if (!DEMO_PRODUCT_IDS.has(room.selectedProductId)) {
    return { ...room, selectedProductId: null };
  }
  const product = getProductById(room.selectedProductId);
  if (product === undefined) {
    return { ...room, selectedProductId: null };
  }
  const compatible =
    product.suitableRoomTypes.includes(room.roomType) &&
    product.suitableStylePresets.includes(room.stylePreset);
  if (!compatible) {
    return { ...room, selectedProductId: null };
  }
  return room;
}

export function normalizeRoom(room: unknown): Room {
  if (typeof room !== "object" || room === null) {
    return RoomSchema.parse(room);
  }
  const migrated = migrateLegacyRoomFields(room as Record<string, unknown>);
  const parsed = RoomSchema.parse(migrated);
  return sanitizeRoomProductSelection(parsed);
}

export function defaultRoomPropertyFields(): Pick<
  Room,
  | "roomType"
  | "ceilingHeightMetres"
  | "ceilingType"
  | "targetLux"
  | "stylePreset"
  | "selectedProductId"
  | "utilisationFactor"
  | "maintenanceFactor"
> {
  return {
    roomType: DEFAULT_ROOM_PROPERTY_VALUES.roomType,
    ceilingHeightMetres: DEFAULT_ROOM_PROPERTY_VALUES.ceilingHeightMetres,
    ceilingType: DEFAULT_ROOM_PROPERTY_VALUES.ceilingType,
    targetLux: DEFAULT_ROOM_PROPERTY_VALUES.targetLux,
    stylePreset: DEFAULT_ROOM_PROPERTY_VALUES.stylePreset,
    selectedProductId: DEFAULT_ROOM_PROPERTY_VALUES.selectedProductId,
    utilisationFactor: DEFAULT_ROOM_PROPERTY_VALUES.utilisationFactor,
    maintenanceFactor: DEFAULT_ROOM_PROPERTY_VALUES.maintenanceFactor,
  };
}

export const ViewportStateSchema = z.object({
  zoom: z.number().positive(),
  offsetX: z.number(),
  offsetY: z.number(),
});

export type ViewportState = z.infer<typeof ViewportStateSchema>;

export const FloorPlanAssetSchema = z.object({
  id: z.string().uuid(),
  fileName: z.string(),
  mimeType: z.string(),
  widthPx: z.number().positive(),
  heightPx: z.number().positive(),
  storagePath: z.string(),
});

export type FloorPlanAsset = z.infer<typeof FloorPlanAssetSchema>;

export const ProjectDocumentSchema = z.object({
  scale: ScaleCalibrationSchema.nullable(),
  rooms: z.array(RoomSchema),
  viewport: ViewportStateSchema.optional(),
});

export type ProjectDocument = z.infer<typeof ProjectDocumentSchema>;

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  floorPlan: FloorPlanAssetSchema.nullable(),
  document: ProjectDocumentSchema,
});

export type Project = z.infer<typeof ProjectSchema>;

export const CreateProjectInputSchema = z.object({
  name: z.string().min(1).max(200),
});

export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;

export const UpdateProjectDocumentInputSchema = z.object({
  scale: ScaleCalibrationSchema.nullable(),
  rooms: z.array(RoomSchema),
  viewport: ViewportStateSchema.optional(),
});

export type UpdateProjectDocumentInput = z.infer<
  typeof UpdateProjectDocumentInputSchema
>;

export const DEFAULT_VIEWPORT: ViewportState = {
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
};

export const EMPTY_PROJECT_DOCUMENT: ProjectDocument = {
  scale: null,
  rooms: [],
  viewport: DEFAULT_VIEWPORT,
};
