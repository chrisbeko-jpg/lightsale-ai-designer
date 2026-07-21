"use client";

import type { KonvaEventObject } from "konva/lib/Node";
import { Circle, Group, Line, RegularPolygon, Rect, Text } from "react-konva";
import type { Luminaire, Room } from "@lightsale/shared";
import {
  assignLuminairePositionNumbers,
  calculateLuminairePlanFootprintPx,
  getProductById,
  getProductDisplayColor,
  hitRadiusPlanPx,
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
  previewOnly?: boolean;
}

export function LuminaireSymbol({
  luminaire,
  room,
  isSelected,
  zoom,
  positionNumber,
  previewOnly = false,
}: LuminaireSymbolProps) {
  const moveLuminaire = useEditorStore((s) => s.moveLuminaire);
  const scale = useEditorStore((s) => s.scale);
  const activeTool = useEditorStore((s) => s.activeTool);

  const product = getProductById(luminaire.productId);
  const category = product?.category ?? "downlight";
  const productColor = getProductDisplayColor(luminaire.productId);
  const footprint = calculateLuminairePlanFootprintPx(product?.dimensions, scale);
  const fallbackRadius = 7 / zoom;
  const modelRadius =
    footprint?.shape === "circle"
      ? footprint.radiusPx
      : Math.max(footprint?.halfWidthPx ?? fallbackRadius, footprint?.halfHeightPx ?? fallbackRadius);
  const hitRadius = hitRadiusPlanPx(footprint, zoom, fallbackRadius);
  const minVisible = 2 / zoom;
  const visibleRadius = Math.max(modelRadius, minVisible);

  const outsideRoom =
    room === undefined ||
    !isPointInPolygon({ x: luminaire.x, y: luminaire.y }, room.vertices);

  const stroke = outsideRoom
    ? "#d05b5b"
    : isSelected
      ? "#f2c94c"
      : "#f4f4f5";
  const fill = outsideRoom
    ? "rgba(208, 91, 91, 0.35)"
    : withAlpha(productColor, 0.85);

  const draggable = activeTool === "select" && !previewOnly;

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

  const isPanel =
    category === "led_panel" ||
    category === "panel" ||
    footprint?.shape === "rectangle";
  const hw = Math.max(footprint?.halfWidthPx ?? visibleRadius, minVisible);
  const hh = Math.max(footprint?.halfHeightPx ?? visibleRadius * 0.6, minVisible);

  return (
    <Group
      x={luminaire.x}
      y={luminaire.y}
      rotation={luminaire.rotationDegrees}
      draggable={draggable}
      listening={!previewOnly}
      opacity={previewOnly ? 0.85 : 1}
      onClick={previewOnly ? undefined : handleSelect}
      onTap={previewOnly ? undefined : handleSelect}
      onDragStart={previewOnly ? undefined : handleDragStart}
      onDragEnd={previewOnly ? undefined : handleDragEnd}
    >
      <Circle
        radius={hitRadius}
        fill="rgba(0,0,0,0.001)"
        listening
      />
      {isPanel ? (
        <Rect
          x={-hw}
          y={-hh}
          width={hw * 2}
          height={hh * 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={2 / zoom}
        />
      ) : category === "tracklighting" || category === "track_spot" ? (
        <Group>
          <Circle
            radius={visibleRadius}
            fill={fill}
            stroke={stroke}
            strokeWidth={2 / zoom}
          />
          <Line
            points={[0, 0, visibleRadius * 0.85, 0]}
            stroke={stroke}
            strokeWidth={2 / zoom}
          />
        </Group>
      ) : category === "recessed_spot" ? (
        <Group>
          <Circle
            radius={visibleRadius}
            fill={fill}
            stroke={stroke}
            strokeWidth={2 / zoom}
          />
          <Circle
            radius={visibleRadius * 0.55}
            stroke={stroke}
            strokeWidth={1.5 / zoom}
          />
        </Group>
      ) : category === "surface_spot" ? (
        <RegularPolygon
          sides={4}
          radius={visibleRadius}
          rotation={45}
          fill={fill}
          stroke={stroke}
          strokeWidth={2 / zoom}
        />
      ) : category === "linear" ? (
        <Line
          points={[-visibleRadius * 1.1, 0, visibleRadius * 1.1, 0]}
          stroke={productColor}
          strokeWidth={4 / zoom}
          lineCap="round"
        />
      ) : (
        <Circle
          radius={visibleRadius}
          fill={fill}
          stroke={stroke}
          strokeWidth={2 / zoom}
        />
      )}
      {positionNumber !== undefined ? (
        <Text
          y={visibleRadius + 6 / zoom}
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
          radius={Math.max(visibleRadius, hitRadius * 0.85)}
          stroke="#d05b5b"
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
