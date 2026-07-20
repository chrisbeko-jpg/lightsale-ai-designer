"use client";

import type { RoomPropertyPatch, RoomType } from "@lightsale/shared";
import {
  calculateRequiredLumens,
  defaultTargetLuxForRoomType,
  formatAreaSquareMetres,
  formatRequiredLumens,
  getEffectiveTargetLux,
  isTargetLuxUnset,
  polygonAreaSquareMetres,
} from "@lightsale/shared";
import { useEditorStore } from "@/lib/editor/store";
import {
  ceilingTypeOptions,
  roomTypeLabel,
  roomTypeOptions,
  stylePresetOptions,
} from "@/lib/room-property-labels";
import { fieldClassName, labelClassName, sectionClassName } from "./editor-form-styles";

export function RoomTab() {
  const selectedRoomId = useEditorStore((s) => s.selectedRoomId);
  const rooms = useEditorStore((s) => s.rooms);
  const scale = useEditorStore((s) => s.scale);
  const updateRoomProperties = useEditorStore((s) => s.updateRoomProperties);

  const room = rooms.find((item) => item.id === selectedRoomId) ?? null;

  if (room === null) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Select a room on the floor plan or draw a new room to edit room properties.
      </p>
    );
  }

  const areaM2 =
    scale !== null ? polygonAreaSquareMetres(room.vertices, scale) : null;
  const effectiveLux = getEffectiveTargetLux(room);
  const defaultLux = defaultTargetLuxForRoomType(room.roomType);
  const requiredLumens =
    areaM2 !== null ? calculateRequiredLumens(areaM2, effectiveLux) : null;

  const patch = (updates: RoomPropertyPatch) => {
    updateRoomProperties(room.id, updates);
  };

  return (
    <div className="space-y-3">
      <div className={sectionClassName}>
        <p className="text-sm font-medium text-white">{room.name}</p>
        <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
          <dt className="text-[var(--muted)]">Type</dt>
          <dd className="text-right text-white">{roomTypeLabel(room.roomType)}</dd>
          <dt className="text-[var(--muted)]">Area</dt>
          <dd className="text-right text-white">
            {areaM2 !== null ? formatAreaSquareMetres(areaM2) : "Set scale"}
          </dd>
          <dt className="text-[var(--muted)]">Target lux</dt>
          <dd className="text-right text-white">{effectiveLux} lx</dd>
          <dt className="text-[var(--muted)]">Required lumens</dt>
          <dd className="text-right text-white">
            {requiredLumens !== null
              ? `${formatRequiredLumens(requiredLumens)} lm`
              : "—"}
          </dd>
        </dl>
      </div>

      <label className={labelClassName}>
        Room name
        <input
          type="text"
          value={room.name}
          onChange={(event) => patch({ name: event.target.value })}
          className={fieldClassName}
          maxLength={200}
        />
      </label>

      <label className={labelClassName}>
        Room type
        <select
          value={room.roomType}
          onChange={(event) => patch({ roomType: event.target.value as RoomType })}
          className={fieldClassName}
        >
          {roomTypeOptions().map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClassName}>
        Ceiling height (m)
        <input
          type="number"
          min="0.1"
          step="0.1"
          value={room.ceilingHeightMetres}
          onChange={(event) => {
            const metres = parseFloat(event.target.value);
            if (Number.isFinite(metres) && metres > 0) {
              patch({ ceilingHeightMetres: metres });
            }
          }}
          className={fieldClassName}
        />
      </label>

      <label className={labelClassName}>
        Ceiling type
        <select
          value={room.ceilingType}
          onChange={(event) => {
            const option = ceilingTypeOptions().find(
              (item) => item.value === event.target.value,
            );
            if (option) {
              patch({ ceilingType: option.value });
            }
          }}
          className={fieldClassName}
        >
          {ceilingTypeOptions().map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClassName}>
        Target lux
        <input
          type="number"
          min="1"
          step="1"
          placeholder={`Default (${defaultLux})`}
          value={room.targetLux ?? ""}
          onChange={(event) => {
            const raw = event.target.value.trim();
            if (raw === "") {
              patch({ targetLux: null });
              return;
            }
            const lux = parseFloat(raw);
            if (Number.isFinite(lux) && lux > 0) {
              patch({ targetLux: lux });
            }
          }}
          className={fieldClassName}
        />
        {isTargetLuxUnset(room) ? (
          <span className="mt-1 block text-[11px] text-[var(--muted)]">
            Using default for this room type: {defaultLux} lx
          </span>
        ) : null}
      </label>

      <label className={labelClassName}>
        Style preset
        <select
          value={room.stylePreset}
          onChange={(event) => {
            const option = stylePresetOptions().find(
              (item) => item.value === event.target.value,
            );
            if (option) {
              patch({ stylePreset: option.value });
            }
          }}
          className={fieldClassName}
        >
          {stylePresetOptions().map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
