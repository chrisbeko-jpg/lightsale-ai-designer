"use client";

import type { KonvaEventObject } from "konva/lib/Node";
import { Circle, Group, Line, RegularPolygon, Rect, Text } from "react-konva";
import type { Luminaire, Room } from "@lightsale/shared";
import {
  assignLuminairePositionNumbers,
  getProductDisplayColor,
  hitRadiusPlanPx,
  isPointInPolygon,
  LUMINAIRE_SYMBOL_STROKE_PLAN_PX,
  luminaireNumberLabelOffsetPlanPx,
  resolveLuminaireSymbolMetrics,
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
  const editorMode = useEditorStore((s) => s.editorMode);

  const metrics = resolveLuminaireSymbolMetrics(luminaire, scale);
  const { category, footprint, isPanel } = metrics;
  const productColor = getProductDisplayColor(luminaire.productId);

  const fallbackRadius = 7 / zoom;
  const modelRadius =
    footprint.shape === "circle"
      ? footprint.radiusPx
      : Math.max(footprint.halfWidthPx, footprint.halfHeightPx);
  const hitRadius = hitRadiusPlanPx(footprint, zoom, fallbackRadius);

  const hw = footprint.halfWidthPx;
  const hh = footprint.halfHeightPx;
  const circleRadius = footprint.radiusPx;
  const strokeWidth = LUMINAIRE_SYMBOL_STROKE_PLAN_PX / zoom;
  const labelOffsetY = luminaireNumberLabelOffsetPlanPx(footprint) / zoom;

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

  const draggable = editorMode === "select" && !previewOnly;

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
          strokeWidth={strokeWidth}
        />
      ) : category === "tracklighting" || category === "track_spot" ? (
        <Group>
          <Circle
            radius={circleRadius}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <Line
            points={[0, 0, circleRadius * 0.85, 0]}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </Group>
      ) : category === "recessed_spot" ? (
        <Group>
          <Circle
            radius={circleRadius}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <Circle
            radius={circleRadius * 0.55}
            stroke={stroke}
            strokeWidth={strokeWidth * 0.75}
          />
        </Group>
      ) : category === "surface_spot" ? (
        <RegularPolygon
          sides={4}
          radius={circleRadius}
          rotation={45}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      ) : category === "linear" ? (
        <Line
          points={[-circleRadius * 1.1, 0, circleRadius * 1.1, 0]}
          stroke={productColor}
          strokeWidth={strokeWidth * 2}
          lineCap="round"
        />
      ) : (
        <Circle
          radius={circleRadius}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )}
      {positionNumber !== undefined ? (
        <Text
          y={labelOffsetY}
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
          radius={Math.max(modelRadius, hitRadius * 0.85)}
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
