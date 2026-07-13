"use client";

import { create } from "zustand";
import type { Point, Project, Room, ScaleCalibration } from "@lightsale/shared";
import { panViewport, zoomAtPoint } from "@lightsale/shared";
import { v4 as uuidv4 } from "uuid";
import {
  canRedo,
  canUndo,
  createHistory,
  pushHistory,
  redo,
  undo,
  type HistoryStacks,
} from "./history";
import {
  cloneDocumentState,
  documentFromProject,
  initialEditorState,
  toPersistedDocument,
  type EditorDocumentState,
  type EditorState,
  type EditorTool,
} from "./types";

interface EditorActions {
  loadProject: (project: Project, floorPlanUrl: string | null) => void;
  setTool: (tool: EditorTool) => void;
  selectRoom: (roomId: string | null) => void;
  setViewport: (viewport: EditorState["viewport"]) => void;
  pan: (deltaX: number, deltaY: number) => void;
  zoomAt: (screenX: number, screenY: number, newZoom: number) => void;
  addScalePoint: (point: Point) => void;
  clearScaleDraft: () => void;
  applyScale: (realDistanceMetres: number) => void;
  addDrawVertex: (point: Point) => void;
  finishDrawingRoom: () => void;
  cancelDrawing: () => void;
  updateRoomName: (roomId: string, name: string) => void;
  updateRoomVertex: (roomId: string, index: number, point: Point) => void;
  deleteRoom: (roomId: string) => void;
  mutateDocument: (
    updater: (doc: EditorDocumentState) => EditorDocumentState,
    recordHistory?: boolean,
  ) => void;
  undo: () => void;
  redo: () => void;
  markSaved: () => void;
  setSaving: (isSaving: boolean) => void;
  getPersistedDocument: () => ReturnType<typeof toPersistedDocument>;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

type EditorStore = EditorState & {
  history: HistoryStacks;
} & EditorActions;

function currentDocument(state: EditorState): EditorDocumentState {
  return { scale: state.scale, rooms: state.rooms };
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  ...initialEditorState,
  history: createHistory(),

  loadProject: (project, floorPlanUrl) => {
    const doc = documentFromProject(project.document);
    set({
      ...initialEditorState,
      projectId: project.id,
      projectName: project.name,
      scale: doc.scale,
      rooms: doc.rooms,
      viewport: project.document.viewport ?? initialEditorState.viewport,
      floorPlanUrl,
      floorPlanMimeType: project.floorPlan?.mimeType ?? null,
      floorPlanSize: project.floorPlan
        ? { width: project.floorPlan.widthPx, height: project.floorPlan.heightPx }
        : null,
      history: createHistory(),
      isDirty: false,
    });
  },

  setTool: (tool) =>
    set({
      activeTool: tool,
      scaleDraftPoints: tool === "scale" ? get().scaleDraftPoints : [],
      drawDraftVertices: tool === "draw-room" ? get().drawDraftVertices : [],
    }),

  selectRoom: (roomId) => set({ selectedRoomId: roomId }),

  setViewport: (viewport) => set({ viewport }),

  pan: (deltaX, deltaY) =>
    set((state) => ({
      viewport: panViewport(state.viewport, deltaX, deltaY),
    })),

  zoomAt: (screenX, screenY, newZoom) =>
    set((state) => ({
      viewport: zoomAtPoint(state.viewport, { x: screenX, y: screenY }, newZoom),
    })),

  mutateDocument: (updater, recordHistory = true) =>
    set((state) => {
      const before = currentDocument(state);
      const after = updater(currentDocument(state));
      const history = recordHistory
        ? pushHistory(state.history, before)
        : state.history;
      return {
        scale: after.scale,
        rooms: after.rooms,
        history,
        isDirty: true,
      };
    }),

  addScalePoint: (point) =>
    set((state) => {
      if (state.activeTool !== "scale") {
        return state;
      }
      const next = [...state.scaleDraftPoints, point].slice(-2);
      return { scaleDraftPoints: next };
    }),

  clearScaleDraft: () => set({ scaleDraftPoints: [] }),

  applyScale: (realDistanceMetres) => {
    const state = get();
    if (state.scaleDraftPoints.length < 2) {
      return;
    }
    const pointA = state.scaleDraftPoints[0];
    const pointB = state.scaleDraftPoints[1];
    if (!pointA || !pointB) {
      return;
    }
    const calibration: ScaleCalibration = {
      pointA,
      pointB,
      realDistanceMetres,
    };
    get().mutateDocument((doc) => ({ ...doc, scale: calibration }));
    set({ scaleDraftPoints: [], activeTool: "select" });
  },

  addDrawVertex: (point) =>
    set((state) => {
      if (state.activeTool !== "draw-room") {
        return state;
      }
      return { drawDraftVertices: [...state.drawDraftVertices, point] };
    }),

  finishDrawingRoom: () => {
    const state = get();
    if (state.drawDraftVertices.length < 3) {
      return;
    }
    const roomNumber = state.rooms.length + 1;
    const room: Room = {
      id: uuidv4(),
      name: `Room ${roomNumber}`,
      vertices: state.drawDraftVertices.map((v) => ({ ...v })),
    };
    get().mutateDocument((doc) => ({
      ...doc,
      rooms: [...doc.rooms, room],
    }));
    set({
      drawDraftVertices: [],
      selectedRoomId: room.id,
      activeTool: "select",
    });
  },

  cancelDrawing: () => set({ drawDraftVertices: [] }),

  updateRoomName: (roomId, name) =>
    get().mutateDocument((doc) => ({
      ...doc,
      rooms: doc.rooms.map((room) =>
        room.id === roomId ? { ...room, name } : room,
      ),
    })),

  updateRoomVertex: (roomId, index, point) =>
    get().mutateDocument((doc) => ({
      ...doc,
      rooms: doc.rooms.map((room) => {
        if (room.id !== roomId) {
          return room;
        }
        const vertices = room.vertices.map((vertex, i) =>
          i === index ? { ...point } : vertex,
        );
        return { ...room, vertices };
      }),
    })),

  deleteRoom: (roomId) => {
    get().mutateDocument((doc) => ({
      ...doc,
      rooms: doc.rooms.filter((room) => room.id !== roomId),
    }));
    set((state) => ({
      selectedRoomId:
        state.selectedRoomId === roomId ? null : state.selectedRoomId,
    }));
  },

  undo: () =>
    set((state) => {
      const result = undo(state.history, currentDocument(state));
      if (!result.document) {
        return state;
      }
      return {
        ...cloneDocumentState(result.document),
        history: result.history,
        isDirty: true,
      };
    }),

  redo: () =>
    set((state) => {
      const result = redo(state.history, currentDocument(state));
      if (!result.document) {
        return state;
      }
      return {
        ...cloneDocumentState(result.document),
        history: result.history,
        isDirty: true,
      };
    }),

  markSaved: () => set({ isDirty: false }),
  setSaving: (isSaving) => set({ isSaving }),

  getPersistedDocument: () => {
    const state = get();
    return {
      ...toPersistedDocument(currentDocument(state)),
      viewport: state.viewport,
    };
  },

  canUndo: () => canUndo(get().history),
  canRedo: () => canRedo(get().history),
}));
