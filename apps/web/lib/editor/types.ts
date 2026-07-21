import type {
  Luminaire,
  OutputSettings,
  Point,
  ProjectDocument,
  Room,
  ScaleCalibration,
} from "@lightsale/shared";
import {
  DEFAULT_LAYOUT_WALL_MARGIN_METRES,
  DEFAULT_VIEWPORT,
  normalizeLoadedProjectDocument,
} from "@lightsale/shared";

export type EditorTool = "select" | "pan" | "scale" | "draw-room";

export type EditorPropertiesTab = "room" | "lighting" | "output";

export interface CanvasHostRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ProductDragSession {
  productId: string;
  roomId: string;
  pointerId: number;
  screenX: number;
  screenY: number;
  overCanvas: boolean;
  canvasPoint: Point | null;
}

export interface EditorDocumentState {
  scale: ScaleCalibration | null;
  rooms: Room[];
  luminaires: Luminaire[];
  outputSettings: OutputSettings;
}

export interface EditorState extends EditorDocumentState {
  projectId: string | null;
  projectName: string;
  viewport: {
    zoom: number;
    offsetX: number;
    offsetY: number;
  };
  activeTool: EditorTool;
  propertiesTab: EditorPropertiesTab;
  selectedRoomId: string | null;
  selectedLuminaireId: string | null;
  layoutWallMarginMetres: number;
  isDraggingLuminaire: boolean;
  productDrag: ProductDragSession | null;
  placementMessage: string | null;
  canvasHostRect: CanvasHostRect | null;
  scaleDraftPoints: Point[];
  drawDraftVertices: Point[];
  floorPlanUrl: string | null;
  floorPlanMimeType: string | null;
  floorPlanSize: { width: number; height: number } | null;
  isDirty: boolean;
  isSaving: boolean;
}

export const initialEditorState: EditorState = {
  projectId: null,
  projectName: "",
  scale: null,
  rooms: [],
  luminaires: [],
  outputSettings: normalizeLoadedProjectDocument({}).outputSettings,
  viewport: { ...DEFAULT_VIEWPORT },
  activeTool: "select",
  propertiesTab: "room",
  selectedRoomId: null,
  selectedLuminaireId: null,
  layoutWallMarginMetres: DEFAULT_LAYOUT_WALL_MARGIN_METRES,
  isDraggingLuminaire: false,
  productDrag: null,
  placementMessage: null,
  canvasHostRect: null,
  scaleDraftPoints: [],
  drawDraftVertices: [],
  floorPlanUrl: null,
  floorPlanMimeType: null,
  floorPlanSize: null,
  isDirty: false,
  isSaving: false,
};

export function toPersistedDocument(state: EditorDocumentState): ProjectDocument {
  return {
    scale: state.scale,
    rooms: state.rooms,
    luminaires: state.luminaires,
    outputSettings: state.outputSettings,
  };
}

export function documentFromProject(
  document: ProjectDocument,
  fallbackProjectName?: string,
): EditorDocumentState {
  const normalized = normalizeLoadedProjectDocument(document, fallbackProjectName);
  return {
    scale: normalized.scale,
    rooms: normalized.rooms,
    luminaires: normalized.luminaires,
    outputSettings: normalized.outputSettings,
  };
}

export function cloneDocumentState(state: EditorDocumentState): EditorDocumentState {
  return {
    scale: state.scale
      ? {
          ...state.scale,
          pointA: { ...state.scale.pointA },
          pointB: { ...state.scale.pointB },
        }
      : null,
    rooms: state.rooms.map((room) => ({
      ...room,
      vertices: room.vertices.map((v) => ({ ...v })),
    })),
    luminaires: state.luminaires.map((item) => ({ ...item })),
    outputSettings: { ...state.outputSettings },
  };
}
