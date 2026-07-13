"use client";

import { Circle, Line } from "react-konva";
import type { Point } from "@lightsale/shared";
import { pixelDistance } from "@lightsale/shared";

interface ScaleOverlayProps {
  points: Point[];
  zoom: number;
}

export function ScaleOverlay({ points, zoom }: ScaleOverlayProps) {
  if (points.length === 0) {
    return null;
  }

  const strokeWidth = 2 / zoom;
  const radius = 6 / zoom;

  return (
    <>
      {points.map((point, index) => (
        <Circle
          key={`scale-${index}`}
          x={point.x}
          y={point.y}
          radius={radius}
          fill="#f59e0b"
          stroke="#ffffff"
          strokeWidth={1.5 / zoom}
        />
      ))}
      {points.length === 2 && points[0] && points[1] ? (
        <Line
          points={[points[0].x, points[0].y, points[1].x, points[1].y]}
          stroke="#f59e0b"
          strokeWidth={strokeWidth}
          dash={[6 / zoom, 4 / zoom]}
        />
      ) : null}
    </>
  );
}

export function scalePreviewMetres(
  points: Point[],
  realDistanceMetres: number,
): number | null {
  if (points.length < 2 || !points[0] || !points[1]) {
    return null;
  }
  return pixelDistance(points[0], points[1]) > 0 ? realDistanceMetres : null;
}
