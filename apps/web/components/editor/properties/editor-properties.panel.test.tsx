/**
 * @vitest-environment jsdom
 */
import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RoomTab } from "@/components/editor/properties/RoomTab";
import { LightingLayoutTab } from "@/components/editor/properties/LightingLayoutTab";
import { useEditorStore } from "@/lib/editor/store";
import { initialEditorState } from "@/lib/editor/types";

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

function resetStore(overrides: Partial<ReturnType<typeof useEditorStore.getState>> = {}) {
  useEditorStore.setState({
    ...initialEditorState,
    selectedRoomId: roomId,
    scale: {
      pointA: { x: 0, y: 0 },
      pointB: { x: 100, y: 0 },
      realDistanceMetres: 10,
    },
    rooms: [baseRoom],
    luminaires: [],
    history: { past: [], future: [] },
    ...overrides,
  });
}

describe("editor properties tabs", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    resetStore();
  });

  it("switches properties tab in store", () => {
    expect(useEditorStore.getState().propertiesTab).toBe("room");
    useEditorStore.getState().setPropertiesTab("lighting");
    expect(useEditorStore.getState().propertiesTab).toBe("lighting");
    useEditorStore.getState().setPropertiesTab("output");
    expect(useEditorStore.getState().propertiesTab).toBe("output");
  });

  it("shows room controls only in Room tab", () => {
    render(<RoomTab />);
    expect(screen.getByLabelText(/room name/i)).toBeTruthy();
    expect(screen.queryByText(/generate lighting layout/i)).toBeNull();
  });

  it("shows layout controls only in Lighting layout tab", () => {
    render(<LightingLayoutTab />);
    expect(screen.getByText(/generate lighting layout/i)).toBeTruthy();
    expect(screen.queryByLabelText(/room type/i)).toBeNull();
    expect(screen.queryByLabelText(/ceiling height/i)).toBeNull();
  });

  it("shows selected luminaire controls when a luminaire is selected", () => {
    useEditorStore.setState({
      luminaires: [
        {
          id: "550e8400-e29b-41d4-a716-446655440099",
          roomId,
          productId: "demo-downlight-evo-12w",
          x: 10,
          y: 20,
          rotationDegrees: 45,
          placementSource: "manual",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      selectedLuminaireId: "550e8400-e29b-41d4-a716-446655440099",
    });
    render(<LightingLayoutTab />);
    expect(screen.getAllByText(/selected luminaire/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/rotation/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /duplicate/i })).toBeTruthy();
  });

  it("persists output settings through document mutation", () => {
    resetStore({ propertiesTab: "output" });
    useEditorStore.getState().updateOutputSettings({
      customerName: "Test Customer",
      showLuminaireNumbers: true,
    });
    const doc = useEditorStore.getState().getPersistedDocument();
    expect(doc.outputSettings?.customerName).toBe("Test Customer");
    expect(doc.outputSettings?.showLuminaireNumbers).toBe(true);
    useEditorStore.getState().updateOutputSettings({
      projectName: "Renamed plan",
    });
    expect(useEditorStore.getState().projectName).toBe("Renamed plan");
  });
});
