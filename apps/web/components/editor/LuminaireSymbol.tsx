"use client";

import type { KonvaEventObject } from "konva/lib/Node";
import { Circle, Group, Line, RegularPolygon, Text } from "react-konva";
import type { Luminaire, Room } from "@lightsale/shared";
import {
  assignLuminairePositionNumbers,
  getProductById,
  getProductDisplayColor,
  isPointInPolygon,
  withAlpha,
} from "@lightsale/shared";
import { useEditorStore } from "@/lib/editor/store";

interface LuminaireSymbolProps {
  luminaire: Luminaire;
  room: Room | undefined;
  isSelected: boolean;
  zoom: number;
  positionNumber?: number;
}

export function LuminaireSymbol({
  luminaire,
  room,
  isSelected,
  zoom,
  positionNumber,
}: LuminaireSymbolProps) {
  const moveLuminaire = useEditorStore((s) => s.moveLuminaire);
  const activeTool = useEditorStore((s) => s.activeTool);

  const product = getProductById(luminaire.productId);
  const category = product?.category ?? "downlight";
  const productColor = getProductDisplayColor(luminaire.productId);

  const outsideRoom =
    room === undefined ||
    !isPointInPolygon({ x: luminaire.x, y: luminaire.y }, room.vertices);

  const stroke = outsideRoom
    ? "#ef4444"
    : isSelected
      ? "#fbbf24"
      : "#f8fafc";
  const fill = outsideRoom
    ? "rgba(239, 68, 68, 0.35)"
    : withAlpha(productColor, 0.85);

  const size = 14 / zoom;
  const draggable = activeTool === "select";

  const handleSelect = (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
    event.cancelBubble = true;
    useEditorStore.setState({
      selectedRoomId: luminaire.roomId,
      selectedLuminaireId: luminaire.id,
    });
  };

  const handleDragStart = (event: KonvaEventObject<DragEvent>) => {
    event.cancelBubble = true;
    useEditorStore.getState().setDraggingLuminaire(true);
  };

  const handleDragEnd = (event: KonvaEventObject<DragEvent>) => {
    useEditorStore.getState().setDraggingLuminaire(false);
    const node = event.target;
    moveLuminaire(luminaire.id, { x: node.x(), y: node.y() });
  };

  return (
    <Group
      x={luminaire.x}
      y={luminaire.y}
      rotation={luminaire.rotationDegrees}
      draggable={draggable}
      onClick={handleSelect}
      onTap={handleSelect}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {category === "panel" ? (
        <Line
          points={[-size, -size * 0.6, size, -size * 0.6, size, size * 0.6, -size, size * 0.6]}
          closed
          fill={fill}
          stroke={stroke}
          strokeWidth={2 / zoom}
        />
      ) : category === "surface_spot" ? (
        <RegularPolygon
          sides={4}
          radius={size}
          rotation={45}
          fill={fill}
          stroke={stroke}
          strokeWidth={2 / zoom}
        />
      ) : category === "linear" ? (
        <Line
          points={[-size * 1.1, 0, size * 1.1, 0]}
          stroke={productColor}
          strokeWidth={4 / zoom}
          lineCap="round"
        />
      ) : category === "pendant" ? (
        <Circle
          radius={size * 0.65}
          fill={fill}
          stroke={stroke}
          strokeWidth={2 / zoom}
        />
      ) : (
        <Circle
          radius={size * 0.55}
          fill={fill}
          stroke={stroke}
          strokeWidth={2 / zoom}
        />
      )}
      {positionNumber !== undefined ? (
        <Text
          y={size * 0.9}
          text={String(positionNumber)}
          fontSize={10 / zoom}
          fill="#e2e8f0"
          align="center"
          offsetX={6 / zoom}
          listening={false}
        />
      ) : null}
      {outsideRoom ? (
        <Circle
          radius={size * 0.9}
          stroke="#ef4444"
          strokeWidth={1.5 / zoom}
          dash={[4 / zoom, 3 / zoom]}
        />
      ) : null}
    </Group>
  );
}

export function useLuminairePositionNumberMap(): Map<string, number> {
  const luminaires = useEditorStore((s) => s.luminaires);
  const rooms = useEditorStore((s) => s.rooms);
  const labels = assignLuminairePositionNumbers(luminaires, rooms);
  return new Map(labels.map((item) => [item.luminaireId, item.positionNumber]));
}
