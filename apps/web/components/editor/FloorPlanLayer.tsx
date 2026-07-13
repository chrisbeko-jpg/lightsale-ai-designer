"use client";

import { Image as KonvaImage } from "react-konva";
import { useKonvaImage } from "@/hooks/useKonvaImage";

interface FloorPlanLayerProps {
  url: string;
  mimeType: string | null;
}

export function FloorPlanLayer({ url, mimeType }: FloorPlanLayerProps) {
  const image = useKonvaImage(url, mimeType);

  if (!image) {
    return null;
  }

  return (
    <KonvaImage
      image={image}
      x={0}
      y={0}
      listening={false}
    />
  );
}
