"use client";

import { useState } from "react";
import { FloorPlanUpload } from "../FloorPlanUpload";
import { ScaleCalibrationPanel } from "../ScaleCalibrationPanel";
import { RoomListPanel } from "../RoomListPanel";
import { RoomTab } from "./RoomTab";
import { LightingLayoutTab } from "./LightingLayoutTab";
import { OutputTab } from "./OutputTab";
import { useEditorStore } from "@/lib/editor/store";
import type { EditorPropertiesTab } from "@/lib/editor/types";

const TABS: { id: EditorPropertiesTab; label: string }[] = [
  { id: "room", label: "Room" },
  { id: "lighting", label: "Lighting layout" },
  { id: "output", label: "Output" },
];

interface EditorPropertiesPanelProps {
  projectId: string;
  saveError: string | null;
  floorPlanHint: boolean;
}

export function EditorPropertiesPanel({
  projectId,
  saveError,
  floorPlanHint,
}: EditorPropertiesPanelProps) {
  const propertiesTab = useEditorStore((s) => s.propertiesTab);
  const setPropertiesTab = useEditorStore((s) => s.setPropertiesTab);
  const [mobileOpen, setMobileOpen] = useState(false);

  const panelBody = (
    <>
      <FloorPlanUpload projectId={projectId} />
      <ScaleCalibrationPanel />
      <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--background)] p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setPropertiesTab(tab.id)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium ${
              propertiesTab === tab.id
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--muted)] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {propertiesTab === "room" ? <RoomTab /> : null}
      {propertiesTab === "lighting" ? <LightingLayoutTab /> : null}
      {propertiesTab === "output" ? <OutputTab /> : null}
      <div>
        <h3 className="mb-2 text-sm font-medium">Rooms</h3>
        <RoomListPanel />
      </div>
      {saveError ? <p className="text-xs text-red-400">{saveError}</p> : null}
      {floorPlanHint ? (
        <p className="text-xs text-[var(--muted)]">
          Upload a floor plan to begin. Scroll to zoom. Use Pan tool or Shift+drag
          to pan.
        </p>
      ) : null}
    </>
  );

  return (
    <>
      <button
        type="button"
        className="fixed bottom-4 left-4 z-20 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm text-white shadow-lg md:hidden"
        onClick={() => setMobileOpen(true)}
      >
        Properties
      </button>
      {mobileOpen ? (
        <div className="fixed inset-0 z-30 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close properties"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto border-t border-[var(--border)] bg-[var(--panel)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">Properties</span>
              <button
                type="button"
                className="text-sm text-[var(--muted)]"
                onClick={() => setMobileOpen(false)}
              >
                Close
              </button>
            </div>
            {panelBody}
          </aside>
        </div>
      ) : null}
      <aside className="hidden h-full w-[360px] shrink-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--panel)] p-4 md:block lg:w-[380px]">
        <div className="space-y-4">{panelBody}</div>
      </aside>
    </>
  );
}

export function getActivePropertiesTabLabel(tab: EditorPropertiesTab): string {
  return TABS.find((item) => item.id === tab)?.label ?? tab;
}
