/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest";
import { useEditorStore } from "./store";
import { documentFromProject, initialEditorState } from "./types";

const roomId = "550e8400-e29b-41d4-a716-446655440000";

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
  selectedProductId: "demo-downlight-evo-12w",
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
    history: { past: [], future: [] },
  });
}

describe("editor luminaire store", () => {
  beforeEach(() => {
    resetStore();
  });

  it("generates luminaires for a valid room", () => {
    const warnings = useEditorStore.getState().generateLightingLayout(roomId);
    const luminaires = useEditorStore.getState().luminaires;
    expect(luminaires.length).toBeGreaterThan(0);
    expect(luminaires.every((item) => item.roomId === roomId)).toBe(true);
    expect(typeof warnings).toBe("object");
  });

  it("moves luminaire and marks manual placement", () => {
    useEditorStore.getState().generateLightingLayout(roomId);
    const first = useEditorStore.getState().luminaires[0];
    expect(first).toBeDefined();
    useEditorStore.getState().moveLuminaire(first!.id, { x: 50, y: 50 });
    const updated = useEditorStore.getState().luminaires.find(
      (item) => item.id === first!.id,
    );
    expect(updated?.x).toBe(50);
    expect(updated?.placementSource).toBe("manual");
  });

  it("deletes selected luminaire", () => {
    useEditorStore.getState().generateLightingLayout(roomId);
    const before = useEditorStore.getState().luminaires.length;
    const first = useEditorStore.getState().luminaires[0];
    useEditorStore.setState({ selectedLuminaireId: first!.id });
    useEditorStore.getState().deleteSelectedLuminaire();
    expect(useEditorStore.getState().luminaires).toHaveLength(before - 1);
  });

  it("duplicates selected luminaire", () => {
    useEditorStore.getState().generateLightingLayout(roomId);
    const before = useEditorStore.getState().luminaires.length;
    const first = useEditorStore.getState().luminaires[0];
    useEditorStore.setState({ selectedLuminaireId: first!.id });
    useEditorStore.getState().duplicateSelectedLuminaire();
    expect(useEditorStore.getState().luminaires).toHaveLength(before + 1);
  });

  it("persists luminaires in saved document", () => {
    useEditorStore.getState().generateLightingLayout(roomId);
    const doc = useEditorStore.getState().getPersistedDocument();
    expect(doc.luminaires.length).toBeGreaterThan(0);

    resetStore();
    expect(useEditorStore.getState().luminaires).toHaveLength(0);

    useEditorStore.setState({
      luminaires: doc.luminaires,
      rooms: doc.rooms,
      scale: doc.scale,
    });
    expect(useEditorStore.getState().luminaires).toEqual(doc.luminaires);
  });

  it("includes luminaire changes in undo", () => {
    useEditorStore.getState().generateLightingLayout(roomId);
    const countAfterGenerate = useEditorStore.getState().luminaires.length;
    expect(countAfterGenerate).toBeGreaterThan(0);
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().luminaires).toHaveLength(0);
  });

  it("redoes luminaire generate", () => {
    useEditorStore.getState().generateLightingLayout(roomId);
    useEditorStore.getState().undo();
    useEditorStore.getState().redo();
    expect(useEditorStore.getState().luminaires.length).toBeGreaterThan(0);
  });

  it("reloads luminaires via document normalization", () => {
    useEditorStore.getState().generateLightingLayout(roomId);
    const doc = useEditorStore.getState().getPersistedDocument();
    const loaded = documentFromProject(doc);
    expect(loaded.luminaires).toEqual(doc.luminaires);
  });

  it("adds luminaire manually", () => {
    expect(useEditorStore.getState().addLuminaireManually(roomId)).toBe(true);
    expect(useEditorStore.getState().luminaires).toHaveLength(1);
    expect(useEditorStore.getState().luminaires[0]?.placementSource).toBe(
      "manual",
    );
  });

  it("generates layout for track spot product", () => {
    useEditorStore.setState({
      rooms: [
        {
          ...baseRoom,
          selectedProductId: "demo-track-spot-25w",
        },
      ],
    });
    const warnings = useEditorStore.getState().generateLightingLayout(roomId);
    const luminaires = useEditorStore.getState().luminaires;
    expect(luminaires.length).toBeGreaterThan(0);
    expect(luminaires.every((item) => item.productId === "demo-track-spot-25w")).toBe(
      true,
    );
    expect(
      warnings.some((item) => item.includes("Manual placement only")),
    ).toBe(false);
  });

  it("does not remove luminaires in other rooms when replacing one room", () => {
    const otherRoomId = "550e8400-e29b-41d4-a716-446655440099";
    useEditorStore.setState({
      rooms: [
        baseRoom,
        {
          ...baseRoom,
          id: otherRoomId,
          name: "Other",
        },
      ],
    });
    useEditorStore.getState().generateLightingLayout(roomId);
    useEditorStore.getState().generateLightingLayout(otherRoomId);
    expect(useEditorStore.getState().luminaires.some((l) => l.roomId === otherRoomId)).toBe(
      true,
    );
    useEditorStore.getState().regenerateLightingLayout(roomId);
    expect(useEditorStore.getState().luminaires.some((l) => l.roomId === otherRoomId)).toBe(
      true,
    );
  });
});
