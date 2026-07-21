"use client";

import type { KonvaEventObject } from "konva/lib/Node";
import { Circle, Group, Line, Text } from "react-konva";
import type { Room } from "@lightsale/shared";
import { screenToCanvas } from "@lightsale/shared";
import {
  formatAreaSquareMetres,
  polygonAreaSquareMetres,
} from "@lightsale/shared";
import { useEditorStore } from "@/lib/editor/store";

const ROOM_COLORS = [
  "rgba(59, 130, 246, 0.25)",
  "rgba(16, 185, 129, 0.25)",
  "rgba(245, 158, 11, 0.25)",
  "rgba(168, 85, 247, 0.25)",
  "rgba(236, 72, 153, 0.25)",
];

interface RoomPolygonProps {
  room: Room;
  isSelected: boolean;
  onSelect: () => void;
}

export function RoomPolygon({ room, isSelected, onSelect }: RoomPolygonProps) {
  const scale = useEditorStore((s) => s.scale);
  const viewport = useEditorStore((s) => s.viewport);
  const updateRoomVertex = useEditorStore((s) => s.updateRoomVertex);

  const colorIndex =
    room.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    ROOM_COLORS.length;
  const fill = ROOM_COLORS[colorIndex] ?? ROOM_COLORS[0];

  const flatPoints = room.vertices.flatMap((v) => [v.x, v.y]);

  const centroid = room.vertices.reduce(
    (acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }),
    { x: 0, y: 0 },
  );
  const cx = centroid.x / room.vertices.length;
  const cy = centroid.y / room.vertices.length;

  const areaLabel =
    scale !== null
      ? formatAreaSquareMetres(
          polygonAreaSquareMetres(room.vertices, scale),
        )
      : "Set scale";

  const handleVertexDrag =
    (index: number) => (event: KonvaEventObject<DragEvent>) => {
      const node = event.target;
      updateRoomVertex(room.id, index, {
        x: node.x(),
        y: node.y(),
      });
    };

  return (
    <Group
      onClick={(event) => {
        event.cancelBubble = true;
        const stage = event.target.getStage();
        const pointer = stage?.getPointerPosition();
        if (pointer) {
          const point = screenToCanvas(pointer, viewport);
          if (useEditorStore.getState().tryPlaceLuminaireAtCanvasPoint(point)) {
            return;
          }
        }
        onSelect();
      }}
      onTap={onSelect}
    >
      <Line
        points={flatPoints}
        closed
        fill={fill}
        stroke={isSelected ? "#3b82f6" : "#64748b"}
        strokeWidth={(isSelected ? 2.5 : 1.5) / viewport.zoom}
      />
      <Text
        x={cx - 40 / viewport.zoom}
        y={cy - 8 / viewport.zoom}
        text={`${room.name}\n${areaLabel}`}
        fontSize={12 / viewport.zoom}
        fill="#e2e8f0"
        align="center"
        width={80 / viewport.zoom}
        listening={false}
      />
      {isSelected
        ? room.vertices.map((vertex, index) => (
            <Circle
              key={`${room.id}-v-${index}`}
              x={vertex.x}
              y={vertex.y}
              radius={6 / viewport.zoom}
              fill="#3b82f6"
              stroke="#ffffff"
              strokeWidth={1.5 / viewport.zoom}
              draggable
              onDragMove={handleVertexDrag(index)}
              onDragEnd={handleVertexDrag(index)}
            />
          ))
        : null}
    </Group>
  );
}
