import type { CeilingType, RoomType, StylePreset } from "@lightsale/shared";
import {
  CEILING_TYPES,
  ROOM_TYPES,
  STYLE_PRESETS,
} from "@lightsale/shared";

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  living_room: "Living room",
  kitchen: "Kitchen",
  dining_room: "Dining room",
  bedroom: "Bedroom",
  bathroom: "Bathroom",
  hallway: "Hallway",
  home_office: "Home office",
  open_office: "Open office",
  private_office: "Private office",
  meeting_room: "Meeting room",
  reception: "Reception",
  corridor: "Corridor",
  storage: "Storage",
  toilet: "Toilet",
  technical_room: "Technical room",
  other: "Other",
};

const CEILING_TYPE_LABELS: Record<CeilingType, string> = {
  suspended: "Suspended ceiling",
  exposed: "Exposed structure",
  grid: "Grid ceiling",
  sloped: "Sloped / pitched",
  other: "Other",
};

const STYLE_PRESET_LABELS: Record<StylePreset, string> = {
  functional: "Functional",
  warm_modern: "Warm modern",
  minimal: "Minimal",
  hotel_chic: "Hotel chic",
  industrial: "Industrial",
  architectural: "Architectural",
  custom: "Custom",
};

export function roomTypeOptions(): { value: RoomType; label: string }[] {
  return ROOM_TYPES.map((value) => ({
    value,
    label: ROOM_TYPE_LABELS[value],
  }));
}

export function roomTypeLabel(value: RoomType): string {
  return ROOM_TYPE_LABELS[value];
}

export function ceilingTypeOptions(): { value: CeilingType; label: string }[] {
  return CEILING_TYPES.map((value) => ({
    value,
    label: CEILING_TYPE_LABELS[value],
  }));
}

export function stylePresetOptions(): { value: StylePreset; label: string }[] {
  return STYLE_PRESETS.map((value) => ({
    value,
    label: STYLE_PRESET_LABELS[value],
  }));
}
