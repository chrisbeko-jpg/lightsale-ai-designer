"use client";

import { useEffect, useState } from "react";
import type { KonvaEventObject } from "konva/lib/Node";
import { Layer, Line, Stage } from "react-konva";
import type { Point } from "@lightsale/shared";
import { screenToCanvas } from "@lightsale/shared";
import { useEditorStore } from "@/lib/editor/store";
import { FloorPlanLayer } from "./FloorPlanLayer";
import { LuminaireSymbol, useLuminairePositionNumberMap } from "./LuminaireSymbol";
import { RoomPolygon } from "./RoomPolygon";
import { ScaleOverlay } from "./ScaleOverlay";

interface FloorPlanCanvasProps {
  width: number;
  height: number;
}

export function FloorPlanCanvas({ width, height }: FloorPlanCanvasProps) {
  const viewport = useEditorStore((s) => s.viewport);
  const activeTool = useEditorStore((s) => s.activeTool);
  const rooms = useEditorStore((s) => s.rooms);
  const luminaires = useEditorStore((s) => s.luminaires);
  const selectedRoomId = useEditorStore((s) => s.selectedRoomId);
  const selectedLuminaireId = useEditorStore((s) => s.selectedLuminaireId);
  const scaleDraftPoints = useEditorStore((s) => s.scaleDraftPoints);
  const drawDraftVertices = useEditorStore((s) => s.drawDraftVertices);
  const floorPlanUrl = useEditorStore((s) => s.floorPlanUrl);
  const floorPlanMimeType = useEditorStore((s) => s.floorPlanMimeType);
  const outputSettings = useEditorStore((s) => s.outputSettings);
  const positionNumbers = useLuminairePositionNumberMap();

  const pan = useEditorStore((s) => s.pan);
  const zoomAt = useEditorStore((s) => s.zoomAt);
  const addScalePoint = useEditorStore((s) => s.addScalePoint);
  const addDrawVertex = useEditorStore((s) => s.addDrawVertex);
  const selectRoom = useEditorStore((s) => s.selectRoom);
  const selectLuminaire = useEditorStore((s) => s.selectLuminaire);

  const [isPanning, setIsPanning] = useState(false);
  const [lastPointer, setLastPointer] = useState<Point | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        useEditorStore.getState().cancelDrawing();
        useEditorStore.getState().clearScaleDraft();
        useEditorStore.getState().selectLuminaire(null);
      }
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement) &&
        !(event.target instanceof HTMLSelectElement)
      ) {
        useEditorStore.getState().deleteSelectedLuminaire();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "d") {
        event.preventDefault();
        useEditorStore.getState().duplicateSelectedLuminaire();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getCanvasPoint = (event: KonvaEventObject<MouseEvent | TouchEvent>): Point => {
    const stage = event.target.getStage();
    if (!stage) {
      return { x: 0, y: 0 };
    }
    const pointer = stage.getPointerPosition();
    if (!pointer) {
      return { x: 0, y: 0 };
    }
    return screenToCanvas(pointer, viewport);
  };

  const handleWheel = (event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    const stage = event.target.getStage();
    if (!stage) {
      return;
    }
    const pointer = stage.getPointerPosition();
    if (!pointer) {
      return;
    }
    const direction = event.evt.deltaY > 0 ? -1 : 1;
    const factor = direction > 0 ? 1.1 : 1 / 1.1;
    zoomAt(pointer.x, pointer.y, viewport.zoom * factor);
  };

  const handlePointerDown = (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (useEditorStore.getState().isDraggingLuminaire) {
      return;
    }
    const canvasPoint = getCanvasPoint(event);

    if (activeTool === "pan" || event.evt.shiftKey) {
      setIsPanning(true);
      const stage = event.target.getStage();
      const pointer = stage?.getPointerPosition();
      setLastPointer(pointer ?? null);
      return;
    }

    if (activeTool === "scale") {
      addScalePoint(canvasPoint);
      return;
    }

    if (activeTool === "draw-room") {
      addDrawVertex(canvasPoint);
      return;
    }

    if (activeTool === "select") {
      const stage = event.target.getStage();
      if (stage && event.target === stage) {
        selectRoom(null);
        selectLuminaire(null);
      }
      return;
    }
  };

  const handlePointerMove = (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isPanning || !lastPointer) {
      return;
    }
    const stage = event.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) {
      return;
    }
    pan(pointer.x - lastPointer.x, pointer.y - lastPointer.y);
    setLastPointer(pointer);
  };

  const handlePointerUp = () => {
    setIsPanning(false);
    setLastPointer(null);
  };

  const draftLinePoints = drawDraftVertices.flatMap((v) => [v.x, v.y]);

  return (
    <Stage
      width={width}
      height={height}
      onWheel={handleWheel}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      className="cursor-crosshair bg-[#111820]"
    >
      <Layer
        x={viewport.offsetX}
        y={viewport.offsetY}
        scaleX={viewport.zoom}
        scaleY={viewport.zoom}
      >
        {floorPlanUrl ? (
          <FloorPlanLayer url={floorPlanUrl} mimeType={floorPlanMimeType} />
        ) : null}

        {rooms.map((room) => (
          <RoomPolygon
            key={room.id}
            room={room}
            isSelected={room.id === selectedRoomId}
            onSelect={() => selectRoom(room.id)}
          />
        ))}

        {luminaires.map((luminaire) => {
          const room = rooms.find((item) => item.id === luminaire.roomId);
          const showNumbers = outputSettings.showLuminaireNumbers;
          return (
            <LuminaireSymbol
              key={luminaire.id}
              luminaire={luminaire}
              room={room}
              isSelected={luminaire.id === selectedLuminaireId}
              zoom={viewport.zoom}
              positionNumber={
                showNumbers
                  ? positionNumbers.get(luminaire.id)
                  : undefined
              }
            />
          );
        })}

        {drawDraftVertices.length > 0 ? (
          <Line
            points={draftLinePoints}
            stroke="#60a5fa"
            strokeWidth={2 / viewport.zoom}
            closed={false}
            dash={[8 / viewport.zoom, 4 / viewport.zoom]}
          />
        ) : null}

        <ScaleOverlay points={scaleDraftPoints} zoom={viewport.zoom} />
      </Layer>
    </Stage>
  );
}
