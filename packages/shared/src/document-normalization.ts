import {
  normalizeLuminaires,
  normalizeRoom,
  ScaleCalibrationSchema,
  ViewportStateSchema,
  type Luminaire,
  type Room,
  type ScaleCalibration,
  type ViewportState,
} from "./schemas.js";

export function normalizeLoadedProjectDocument(raw: unknown): {
  scale: ScaleCalibration | null;
  rooms: Room[];
  luminaires: Luminaire[];
  viewport?: ViewportState;
} {
  if (typeof raw !== "object" || raw === null) {
    return { scale: null, rooms: [], luminaires: [] };
  }

  const record = raw as Record<string, unknown>;

  const scaleRaw = record.scale;
  const scale =
    scaleRaw === null || scaleRaw === undefined
      ? null
      : ScaleCalibrationSchema.parse(scaleRaw);

  const rooms = Array.isArray(record.rooms)
    ? record.rooms.map((room) => normalizeRoom(room))
    : [];

  const luminaires = normalizeLuminaires(record.luminaires);

  let viewport: ViewportState | undefined;
  if (record.viewport !== undefined && record.viewport !== null) {
    viewport = ViewportStateSchema.parse(record.viewport);
  }

  return { scale, rooms, luminaires, viewport };
}
