import type {
  Luminaire,
  OutputSettings,
  Room,
  ScaleCalibration,
} from "@lightsale/shared";

export interface PlanRenderInput {
  rooms: readonly Room[];
  luminaires: readonly Luminaire[];
  scale: ScaleCalibration | null;
  settings: OutputSettings;
  floorPlanImage: HTMLImageElement | null;
  pixelWidth: number;
  pixelHeight: number;
}

export interface PlanRenderLayout {
  canvasWidth: number;
  canvasHeight: number;
  planAreaX: number;
  planAreaY: number;
  planAreaWidth: number;
  planAreaHeight: number;
}

export type PlanMapPoint = (point: { x: number; y: number }) => {
  x: number;
  y: number;
};

export interface PlanRenderTransformContext {
  mapPoint: PlanMapPoint;
  planAreaX: number;
  planAreaY: number;
  planAreaWidth: number;
  planAreaHeight: number;
  sourceWidth: number;
  sourceHeight: number;
  transformScale: number;
}
