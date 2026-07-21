"use client";



import { create } from "zustand";

import type { Luminaire, Point, Project, Room, RoomPropertyPatch, ScaleCalibration } from "@lightsale/shared";
import type { OutputSettingsPatch } from "@lightsale/shared";

import {

  buildLayoutGenerationResultText,

  defaultRoomPropertyFields,

  defaultManualLuminairePosition,

  generateLuminairesForRoom,

  getProductById,

  panViewport,

  polygonAreaSquareMetres,

  selectedProductIdAfterRoomContextChange,

  targetLuxAfterRoomTypeChange,

  validateLayoutGeneration,

  validateManualLuminairePlacement,

  validateLuminairePlacementAtPoint,

  createLuminaireAtPoint,

  findRoomContainingPoint,

  getCatalogProducts,

  zoomAtPoint,

} from "@lightsale/shared";

import {
  isScreenPointOverCanvasHost,
  screenPointToCanvas,
} from "./canvas-coords";

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

  type EditorPropertiesTab,

  type EditorState,

  type EditorTool,

} from "./types";



interface EditorActions {

  loadProject: (project: Project, floorPlanUrl: string | null) => void;

  setTool: (tool: EditorTool) => void;

  setPropertiesTab: (tab: EditorPropertiesTab) => void;

  updateOutputSettings: (patch: OutputSettingsPatch) => void;

  selectRoom: (roomId: string | null) => void;

  selectLuminaire: (luminaireId: string | null) => void;

  setLayoutWallMarginMetres: (metres: number) => void;

  setViewport: (viewport: EditorState["viewport"]) => void;

  pan: (deltaX: number, deltaY: number) => void;

  zoomAt: (screenX: number, screenY: number, newZoom: number) => void;

  addScalePoint: (point: Point) => void;

  clearScaleDraft: () => void;

  applyScale: (realDistanceMetres: number) => void;

  addDrawVertex: (point: Point) => void;

  finishDrawingRoom: () => void;

  cancelDrawing: () => void;

  updateRoomProperties: (roomId: string, patch: RoomPropertyPatch) => void;

  updateRoomVertex: (roomId: string, index: number, point: Point) => void;

  deleteRoom: (roomId: string) => void;

  generateLightingLayout: (roomId: string) => string[];

  regenerateLightingLayout: (roomId: string) => string[];

  moveLuminaire: (luminaireId: string, position: Point) => void;

  updateLuminaire: (
    luminaireId: string,
    patch: Partial<
      Pick<Luminaire, "x" | "y" | "rotationDegrees" | "productId">
    >,
  ) => void;

  deleteSelectedLuminaire: () => void;

  duplicateSelectedLuminaire: () => void;

  addLuminaireManually: (roomId: string) => boolean;

  addLuminaireAtPoint: (
    roomId: string,
    productId: string,
    point: Point,
  ) => boolean;

  tryPlaceLuminaireAtCanvasPoint: (point: Point) => boolean;

  beginProductDrag: (
    productId: string,
    roomId: string,
    pointerId: number,
    screenX: number,
    screenY: number,
  ) => void;

  updateProductDrag: (screenX: number, screenY: number) => void;

  endProductDrag: (screenX: number, screenY: number) => void;

  setCanvasHostRect: (rect: EditorState["canvasHostRect"]) => void;

  clearPlacementMessage: () => void;

  setDraggingLuminaire: (dragging: boolean) => void;

  mutateDocument: (

    updater: (doc: EditorDocumentState) => EditorDocumentState,

    recordHistory?: boolean,

  ) => void;

  undo: () => void;

  redo: () => void;

  markSaved: () => void;

  setSaving: (isSaving: boolean) => void;

  getPersistedDocument: () => ReturnType<typeof toPersistedDocument> & {

    viewport: EditorState["viewport"];

  };

  canUndo: () => boolean;

  canRedo: () => boolean;

}



type EditorStore = EditorState & {

  history: HistoryStacks;

} & EditorActions;



function currentDocument(state: EditorState): EditorDocumentState {

  return {
    scale: state.scale,
    rooms: state.rooms,
    luminaires: state.luminaires,
    outputSettings: state.outputSettings,
  };

}



function runLayoutGeneration(

  state: EditorState,

  roomId: string,

  replaceExisting: boolean,

): { warnings: string[]; nextLuminaires: Luminaire[] | null } {

  const room = state.rooms.find((item) => item.id === roomId);

  if (room === undefined) {

    return { warnings: ["Room not found."], nextLuminaires: null };

  }



  const product =

    room.selectedProductId !== null

      ? getProductById(room.selectedProductId)

      : undefined;



  const areaM2 =

    state.scale !== null

      ? polygonAreaSquareMetres(room.vertices, state.scale)

      : null;



  const validation = validateLayoutGeneration({

    scale: state.scale,

    roomAreaSquareMetres: areaM2,

    room,

    product,

  });



  if (!validation.canGenerate || validation.calculatedQuantity === null) {

    return {

      warnings: [validation.reason ?? "Cannot generate layout."],
      nextLuminaires: null,

    };

  }



  if (state.scale === null || product === undefined) {

    return { warnings: ["Missing scale or product."], nextLuminaires: null };

  }



  const existingForRoom = state.luminaires.filter(

    (item) => item.roomId === roomId,

  );

  const hasOtherProductLuminaires = existingForRoom.some(
    (item) => item.productId !== product.id,
  );
  const hasSameProductOnly =
    existingForRoom.length > 0 &&
    existingForRoom.every((item) => item.productId === product.id);

  if (!replaceExisting) {
    if (hasSameProductOnly) {
      return {
        warnings: [
          "This room already has luminaires for the selected product. Use Replace room layout with selected product.",
        ],
        nextLuminaires: null,
      };
    }
  }



  const { luminaires: generated, warnings, placedCount, requestedCount } =
    generateLuminairesForRoom({

    room,

    scale: state.scale,

    product,

    quantity: validation.calculatedQuantity,

    wallMarginMetres: state.layoutWallMarginMetres,

    createId: uuidv4,

  });

  const resultMessages = [
    ...warnings,
    buildLayoutGenerationResultText({
      placedCount,
      requestedCount,
      productName: product.name,
    }),
  ];



  const baseLuminaires = replaceExisting
    ? state.luminaires.filter((item) => item.roomId !== roomId)
    : hasOtherProductLuminaires
      ? state.luminaires
      : state.luminaires.filter((item) => item.roomId !== roomId);

  return {
    warnings: resultMessages,
    nextLuminaires: [...baseLuminaires, ...generated],
  };
}



export const useEditorStore = create<EditorStore>((set, get) => ({

  ...initialEditorState,

  history: createHistory(),



  loadProject: (project, floorPlanUrl) => {

    const doc = documentFromProject(project.document, project.name);

    set({

      ...initialEditorState,

      projectId: project.id,

      projectName: doc.outputSettings.projectName ?? project.name,

      scale: doc.scale,

      rooms: doc.rooms,

      luminaires: doc.luminaires,

      outputSettings: doc.outputSettings,

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



  setPropertiesTab: (tab) => set({ propertiesTab: tab }),



  updateOutputSettings: (patch) => {
    get().mutateDocument((doc) => ({
      ...doc,
      outputSettings: { ...doc.outputSettings, ...patch },
    }));
    if (patch.projectName !== undefined) {
      set({ projectName: patch.projectName ?? get().projectName });
    }
  },



  selectRoom: (roomId) =>
    set((state) => ({
      selectedRoomId: roomId,
      selectedLuminaireId:
        state.selectedLuminaireId !== null &&
        state.luminaires.find((item) => item.id === state.selectedLuminaireId)
          ?.roomId !== roomId
          ? null
          : state.selectedLuminaireId,
    })),



  selectLuminaire: (luminaireId) => set({ selectedLuminaireId: luminaireId }),



  setLayoutWallMarginMetres: (metres) => {

    if (Number.isFinite(metres) && metres >= 0) {

      set({ layoutWallMarginMetres: metres });

    }

  },



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

        luminaires: after.luminaires,

        outputSettings: after.outputSettings,

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

      ...defaultRoomPropertyFields(),

    };

    get().mutateDocument((doc) => ({

      ...doc,

      rooms: [...doc.rooms, room],

    }));

    set({

      drawDraftVertices: [],

      selectedRoomId: room.id,

      selectedLuminaireId: null,

      activeTool: "select",

    });

  },



  cancelDrawing: () => set({ drawDraftVertices: [] }),



  updateRoomProperties: (roomId, patch) =>

    get().mutateDocument((doc) => ({

      ...doc,

      rooms: doc.rooms.map((room) => {

        if (room.id !== roomId) {

          return room;

        }

        const next = { ...room, ...patch };

        if (patch.roomType !== undefined) {

          next.targetLux = targetLuxAfterRoomTypeChange(

            room.targetLux,

            patch.roomType,

          );

        }

        if (patch.roomType !== undefined || patch.stylePreset !== undefined) {

          const product =

            next.selectedProductId !== null

              ? getProductById(next.selectedProductId)

              : undefined;

          next.selectedProductId = selectedProductIdAfterRoomContextChange(

            next.selectedProductId,

            product,

            next,

          );

        }

        if (next.name.trim().length === 0) {

          return room;

        }

        return next;

      }),

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

      luminaires: doc.luminaires.filter((item) => item.roomId !== roomId),

    }));

    set((state) => ({

      selectedRoomId:

        state.selectedRoomId === roomId ? null : state.selectedRoomId,

      selectedLuminaireId:

        state.luminaires.find((item) => item.id === state.selectedLuminaireId)

          ?.roomId === roomId

          ? null

          : state.selectedLuminaireId,

    }));

  },



  generateLightingLayout: (roomId) => {

    const state = get();

    const result = runLayoutGeneration(state, roomId, false);
    if (result.nextLuminaires !== null) {
      get().mutateDocument((doc) => ({
        ...doc,
        luminaires: result.nextLuminaires!,
      }));
    }
    return result.warnings;

  },



  regenerateLightingLayout: (roomId) => {

    const state = get();

    const result = runLayoutGeneration(state, roomId, true);
    if (result.nextLuminaires !== null) {
      get().mutateDocument((doc) => ({
        ...doc,
        luminaires: result.nextLuminaires!,
      }));
    }
    return result.warnings;

  },



  moveLuminaire: (luminaireId, position) =>

    get().mutateDocument((doc) => ({

      ...doc,

      luminaires: doc.luminaires.map((item) => {

        if (item.id !== luminaireId) {

          return item;

        }

        return {

          ...item,

          x: position.x,

          y: position.y,

          placementSource: "manual",

        };

      }),

    })),



  updateLuminaire: (luminaireId, patch) =>
    get().mutateDocument((doc) => ({
      ...doc,
      luminaires: doc.luminaires.map((item) => {
        if (item.id !== luminaireId) {
          return item;
        }
        const next = { ...item, ...patch };
        if (patch.x !== undefined || patch.y !== undefined) {
          next.placementSource = "manual";
        }
        return next;
      }),
    })),



  deleteSelectedLuminaire: () => {

    const { selectedLuminaireId } = get();

    if (selectedLuminaireId === null) {

      return;

    }

    get().mutateDocument((doc) => ({

      ...doc,

      luminaires: doc.luminaires.filter(

        (item) => item.id !== selectedLuminaireId,

      ),

    }));

    set({ selectedLuminaireId: null });

  },



  duplicateSelectedLuminaire: () => {

    const state = get();

    if (state.selectedLuminaireId === null) {

      return;

    }

    const source = state.luminaires.find(

      (item) => item.id === state.selectedLuminaireId,

    );

    if (source === undefined) {

      return;

    }

    const offset = 24 / state.viewport.zoom;

    const duplicate: Luminaire = {

      ...source,

      id: uuidv4(),

      x: source.x + offset,

      y: source.y + offset,

      placementSource: "manual",

      createdAt: new Date().toISOString(),

    };

    get().mutateDocument((doc) => ({

      ...doc,

      luminaires: [...doc.luminaires, duplicate],

    }));

    set({ selectedLuminaireId: duplicate.id });

  },



  addLuminaireManually: (roomId) => {

    const state = get();

    const room = state.rooms.find((item) => item.id === roomId);

    if (room === undefined) {

      return false;

    }

    const product =

      room.selectedProductId !== null

        ? getProductById(room.selectedProductId)

        : undefined;

    const validation = validateManualLuminairePlacement({

      scale: state.scale,

      room,

      product,

    });

    if (!validation.ok || product === undefined) {

      return false;

    }

    const position = defaultManualLuminairePosition(room);

    const luminaire: Luminaire = {

      id: uuidv4(),

      roomId,

      productId: product.id,

      x: position.x,

      y: position.y,

      rotationDegrees: 0,

      placementSource: "manual",

      createdAt: new Date().toISOString(),

    };

    get().mutateDocument((doc) => ({

      ...doc,

      luminaires: [...doc.luminaires, luminaire],

    }));

    set({ selectedLuminaireId: luminaire.id, selectedRoomId: roomId });

    return true;

  },



  addLuminaireAtPoint: (roomId, productId, point) => {

    const state = get();

    const room = state.rooms.find((item) => item.id === roomId);

    if (room === undefined) {

      return false;

    }

    const product = getProductById(productId);

    const validation = validateLuminairePlacementAtPoint({

      scale: state.scale,

      room,

      product,

      point,

      floorPlanBounds: state.floorPlanSize,

      catalogProducts: getCatalogProducts(),

    });

    if (!validation.ok || product === undefined) {

      set({ placementMessage: validation.reason ?? "Cannot place luminaire here." });

      return false;

    }

    const luminaire = createLuminaireAtPoint({

      id: uuidv4(),

      roomId,

      productId: product.id,

      point,

    });

    get().mutateDocument((doc) => ({

      ...doc,

      luminaires: [...doc.luminaires, luminaire],

    }));

    set({

      selectedLuminaireId: luminaire.id,

      selectedRoomId: roomId,

      placementMessage: null,

    });

    return true;

  },



  tryPlaceLuminaireAtCanvasPoint: (point) => {

    const state = get();

    const room = findRoomContainingPoint(point, state.rooms);

    if (room === undefined || room.selectedProductId === null) {

      return false;

    }

    return get().addLuminaireAtPoint(room.id, room.selectedProductId, point);

  },



  beginProductDrag: (productId, roomId, pointerId, screenX, screenY) => {

    const state = get();

    const overCanvas = isScreenPointOverCanvasHost(

      screenX,

      screenY,

      state.canvasHostRect,

    );

    const canvasPoint =

      overCanvas && state.canvasHostRect

        ? screenPointToCanvas(

            screenX,

            screenY,

            state.canvasHostRect,

            state.viewport,

          )

        : null;

    set({

      productDrag: {

        productId,

        roomId,

        pointerId,

        screenX,

        screenY,

        overCanvas,

        canvasPoint,

      },

      placementMessage: null,

    });

  },



  updateProductDrag: (screenX, screenY) => {

    const state = get();

    if (!state.productDrag) {

      return;

    }

    const overCanvas = isScreenPointOverCanvasHost(

      screenX,

      screenY,

      state.canvasHostRect,

    );

    const canvasPoint =

      overCanvas && state.canvasHostRect

        ? screenPointToCanvas(

            screenX,

            screenY,

            state.canvasHostRect,

            state.viewport,

          )

        : null;

    set({

      productDrag: {

        ...state.productDrag,

        screenX,

        screenY,

        overCanvas,

        canvasPoint,

      },

    });

  },



  endProductDrag: (screenX, screenY) => {

    const state = get();

    const session = state.productDrag;

    if (!session) {

      return;

    }

    set({ productDrag: null });

    const overCanvas = isScreenPointOverCanvasHost(

      screenX,

      screenY,

      state.canvasHostRect,

    );

    if (!overCanvas || !state.canvasHostRect) {

      set({ placementMessage: "Drop on the floor plan to place the luminaire." });

      return;

    }

    const point = screenPointToCanvas(

      screenX,

      screenY,

      state.canvasHostRect,

      state.viewport,

    );

    const placed = get().addLuminaireAtPoint(

      session.roomId,

      session.productId,

      point,

    );

    if (placed) {

      get().updateRoomProperties(session.roomId, {

        selectedProductId: session.productId,

      });

    }

  },



  setCanvasHostRect: (rect) => set({ canvasHostRect: rect }),



  clearPlacementMessage: () => set({ placementMessage: null }),



  setDraggingLuminaire: (dragging) => set({ isDraggingLuminaire: dragging }),



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


