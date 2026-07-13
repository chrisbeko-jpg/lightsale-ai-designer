import type { Point, ProjectDocument, Room, ScaleCalibration } from "@lightsale/shared";
import { DEFAULT_VIEWPORT } from "@lightsale/shared";

export type EditorTool = "select" | "pan" | "scale" | "draw-room";

export interface EditorDocumentState {
  scale: ScaleCalibration | null;
  rooms: Room[];
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
  selectedRoomId: string | null;
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
  viewport: { ...DEFAULT_VIEWPORT },
  activeTool: "select",
  selectedRoomId: null,
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
  };
}

export function documentFromProject(document: ProjectDocument): EditorDocumentState {
  return {
    scale: document.scale,
    rooms: document.rooms,
  };
}

export function cloneDocumentState(state: EditorDocumentState): EditorDocumentState {
  return {
    scale: state.scale ? { ...state.scale, pointA: { ...state.scale.pointA }, pointB: { ...state.scale.pointB } } : null,
    rooms: state.rooms.map((room) => ({
      ...room,
      vertices: room.vertices.map((v) => ({ ...v })),
    })),
  };
}
