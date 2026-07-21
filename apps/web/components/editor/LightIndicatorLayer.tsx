"use client";

import { useEffect, useMemo, useState } from "react";
import { Image as KonvaImage } from "react-konva";
import {
  buildProjectHeatmapData,
  getProductById,
  metresPerPixel,
} from "@lightsale/shared";
import { useEditorStore } from "@/lib/editor/store";
import { drawLightIndicatorHeatmap } from "@/lib/heatmap/draw-light-indicator";

interface LightIndicatorLayerProps {
  width: number;
  height: number;
}

export function LightIndicatorLayer({ width, height }: LightIndicatorLayerProps) {
  const rooms = useEditorStore((s) => s.rooms);
  const luminaires = useEditorStore((s) => s.luminaires);
  const scale = useEditorStore((s) => s.scale);
  const floorPlanSize = useEditorStore((s) => s.floorPlanSize);
  const showLightIndicator = useEditorStore((s) => s.outputSettings.showLightIndicator);
  const isDragging = useEditorStore((s) => s.isDraggingLuminaire);

  const [canvasImage, setCanvasImage] = useState<HTMLCanvasElement | null>(null);

  const planSize = useMemo(
    () => ({
      width: floorPlanSize?.width ?? width,
      height: floorPlanSize?.height ?? height,
    }),
    [floorPlanSize, width, height],
  );

  useEffect(() => {
    if (!showLightIndicator || scale === null) {
      setCanvasImage(null);
      return;
    }
    if (isDragging) {
      return;
    }
    const handle = window.setTimeout(() => {
      const mpp = metresPerPixel(scale);
      const roomData = buildProjectHeatmapData({
        rooms,
        luminaires,
        productLookup: getProductById,
        metresPerPixel: mpp,
      });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(planSize.width);
      canvas.height = Math.ceil(planSize.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }
      drawLightIndicatorHeatmap(ctx, roomData, canvas.width, canvas.height, 6);
      setCanvasImage(canvas);
    }, 120);
    return () => window.clearTimeout(handle);
  }, [
    showLightIndicator,
    scale,
    rooms,
    luminaires,
    planSize.width,
    planSize.height,
    isDragging,
  ]);

  if (!showLightIndicator || canvasImage === null) {
    return null;
  }

  return (
    <KonvaImage
      image={canvasImage}
      x={0}
      y={0}
      width={planSize.width}
      height={planSize.height}
      listening={false}
      opacity={0.85}
    />
  );
}
