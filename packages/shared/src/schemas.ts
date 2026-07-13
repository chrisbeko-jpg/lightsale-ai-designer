import { z } from "zod";

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

export const RoomSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  vertices: z.array(PointSchema).min(3),
});

export type Room = z.infer<typeof RoomSchema>;

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
