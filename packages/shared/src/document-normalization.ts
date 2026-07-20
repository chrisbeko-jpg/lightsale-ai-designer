import {
  normalizeLuminaires,
  normalizeRoom,
  ScaleCalibrationSchema,
  ViewportStateSchema,
  type Luminaire,
  type OutputSettings,
  type Room,
  type ScaleCalibration,
  type ViewportState,
} from "./schemas.js";
import { normalizeOutputSettings } from "./output-settings.js";

export function normalizeLoadedProjectDocument(
  raw: unknown,
  fallbackProjectName?: string,
): {
  scale: ScaleCalibration | null;
  rooms: Room[];
  luminaires: Luminaire[];
  outputSettings: OutputSettings;
  viewport?: ViewportState;
} {
  if (typeof raw !== "object" || raw === null) {
    return {
      scale: null,
      rooms: [],
      luminaires: [],
      outputSettings: normalizeOutputSettings(null, fallbackProjectName),
    };
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

  const outputSettings = normalizeOutputSettings(
    record.outputSettings,
    fallbackProjectName,
  );

  let viewport: ViewportState | undefined;
  if (record.viewport !== undefined && record.viewport !== null) {
    viewport = ViewportStateSchema.parse(record.viewport);
  }

  return { scale, rooms, luminaires, outputSettings, viewport };
}
