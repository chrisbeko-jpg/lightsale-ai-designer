import type { Luminaire, Point, ProjectDocument, Room, ScaleCalibration } from "@lightsale/shared";

import {

  DEFAULT_LAYOUT_WALL_MARGIN_METRES,

  DEFAULT_VIEWPORT,

  normalizeLoadedProjectDocument,

} from "@lightsale/shared";



export type EditorTool = "select" | "pan" | "scale" | "draw-room";



export interface EditorDocumentState {

  scale: ScaleCalibration | null;

  rooms: Room[];

  luminaires: Luminaire[];

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

  selectedLuminaireId: string | null;

  layoutWallMarginMetres: number;

  isDraggingLuminaire: boolean;

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

  viewport: { ...DEFAULT_VIEWPORT },

  activeTool: "select",

  selectedRoomId: null,

  selectedLuminaireId: null,

  layoutWallMarginMetres: DEFAULT_LAYOUT_WALL_MARGIN_METRES,

  isDraggingLuminaire: false,

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

  };

}



export function documentFromProject(document: ProjectDocument): EditorDocumentState {

  const normalized = normalizeLoadedProjectDocument(document);

  return {

    scale: normalized.scale,

    rooms: normalized.rooms,

    luminaires: normalized.luminaires,

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

  };

}


