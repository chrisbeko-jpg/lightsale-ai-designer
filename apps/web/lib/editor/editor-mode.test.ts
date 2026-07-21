/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest";
import { useEditorStore } from "./store";
import { initialEditorState } from "./types";

const roomId = "550e8400-e29b-41d4-a716-446655440000";
const productId = "demo-downlight-evo-12w";

const baseRoom = {
  id: roomId,
  name: "Office",
  vertices: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ],
  roomType: "open_office" as const,
  ceilingHeightMetres: 3,
  ceilingType: "exposed" as const,
  targetLux: 100,
  stylePreset: "functional" as const,
  selectedProductId: null as string | null,
  utilisationFactor: 0.6,
  maintenanceFactor: 0.8,
};

function resetStore() {
  useEditorStore.setState({
    ...initialEditorState,
    scale: {
      pointA: { x: 0, y: 0 },
      pointB: { x: 100, y: 0 },
      realDistanceMetres: 10,
    },
    rooms: [baseRoom],
    luminaires: [],
    selectedRoomId: roomId,
    history: { past: [], future: [] },
  });
}

describe("editor placement mode", () => {
  beforeEach(() => {
    resetStore();
  });

  it("enters placement mode when selecting a product", () => {
    useEditorStore.getState().toggleProductForPlacement(roomId, productId);
    expect(useEditorStore.getState().editorMode).toBe("place-luminaire");
    expect(useEditorStore.getState().rooms[0]?.selectedProductId).toBe(productId);
  });

  it("exits placement when clicking the same product again", () => {
    useEditorStore.getState().toggleProductForPlacement(roomId, productId);
    useEditorStore.getState().toggleProductForPlacement(roomId, productId);
    expect(useEditorStore.getState().editorMode).toBe("select");
    expect(useEditorStore.getState().rooms[0]?.selectedProductId).toBeNull();
  });

  it("stopPlacing returns to select mode", () => {
    useEditorStore.getState().toggleProductForPlacement(roomId, productId);
    useEditorStore.getState().stopPlacing();
    expect(useEditorStore.getState().editorMode).toBe("select");
    expect(useEditorStore.getState().rooms[0]?.selectedProductId).toBeNull();
  });

  it("setTool select exits placement mode", () => {
    useEditorStore.getState().toggleProductForPlacement(roomId, productId);
    useEditorStore.getState().setTool("select");
    expect(useEditorStore.getState().editorMode).toBe("select");
    expect(useEditorStore.getState().rooms[0]?.selectedProductId).toBeNull();
  });

  it("does not place luminaires unless placement mode is active", () => {
    useEditorStore.setState({
      rooms: [{ ...baseRoom, selectedProductId: productId }],
      editorMode: "select",
    });
    const placed = useEditorStore
      .getState()
      .tryPlaceLuminaireAtCanvasPoint({ x: 50, y: 50 });
    expect(placed).toBe(false);
    expect(useEditorStore.getState().luminaires).toHaveLength(0);
  });

  it("places luminaires in placement mode", () => {
    useEditorStore.setState({
      floorPlanSize: { width: 500, height: 400 },
    });
    useEditorStore.getState().toggleProductForPlacement(roomId, "wl-bari-small");
    const placed = useEditorStore
      .getState()
      .tryPlaceLuminaireAtCanvasPoint({ x: 50, y: 50 });
    expect(placed).toBe(true);
    expect(useEditorStore.getState().luminaires).toHaveLength(1);
  });
});
