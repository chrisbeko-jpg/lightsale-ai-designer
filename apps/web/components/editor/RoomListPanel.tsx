"use client";

import {
  formatAreaSquareMetres,
  polygonAreaSquareMetres,
} from "@lightsale/shared";
import { useEditorStore } from "@/lib/editor/store";

export function RoomListPanel() {
  const rooms = useEditorStore((s) => s.rooms);
  const scale = useEditorStore((s) => s.scale);
  const selectedRoomId = useEditorStore((s) => s.selectedRoomId);
  const selectRoom = useEditorStore((s) => s.selectRoom);
  const deleteRoom = useEditorStore((s) => s.deleteRoom);

  if (rooms.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        No rooms yet. Use Draw room to add polygons.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {rooms.map((room) => {
        const area =
          scale !== null
            ? formatAreaSquareMetres(
                polygonAreaSquareMetres(room.vertices, scale),
              )
            : "—";
        const isSelected = room.id === selectedRoomId;

        return (
          <li
            key={room.id}
            className={`rounded-lg border p-3 ${
              isSelected
                ? "border-[var(--accent)] bg-[var(--background)]"
                : "border-[var(--border)]"
            }`}
          >
            <div className="flex items-start gap-2">
              <button
                type="button"
                className="flex-1 text-left"
                onClick={() => selectRoom(room.id)}
              >
                <p className="font-medium">{room.name}</p>
                <p className="text-xs text-[var(--muted)]">{area}</p>
              </button>
              <button
                type="button"
                onClick={() => deleteRoom(room.id)}
                className="text-xs text-red-400 hover:text-red-300"
                aria-label={`Delete ${room.name}`}
              >
                Delete
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
