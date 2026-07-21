"use client";

import type { EditorTool } from "@/lib/editor/types";
import { editorModeToLegacyTool } from "@/lib/editor/types";
import { canRedo, canUndo } from "@/lib/editor/history";
import { useEditorStore } from "@/lib/editor/store";

const TOOLS: { id: EditorTool; label: string; hint: string }[] = [
  { id: "select", label: "Select", hint: "Select and edit rooms" },
  { id: "pan", label: "Pan", hint: "Drag to pan (or Shift+drag)" },
  { id: "scale", label: "Scale", hint: "Click two points, then enter distance" },
  { id: "draw-room", label: "Draw room", hint: "Click vertices, then finish" },
];

export function EditorToolbar() {
  const editorMode = useEditorStore((s) => s.editorMode);
  const activeTool = editorModeToLegacyTool(editorMode);
  const setTool = useEditorStore((s) => s.setTool);
  const history = useEditorStore((s) => s.history);
  const canUndoAction = canUndo(history);
  const canRedoAction = canRedo(history);
  const undoAction = useEditorStore((s) => s.undo);
  const redoAction = useEditorStore((s) => s.redo);
  const finishDrawingRoom = useEditorStore((s) => s.finishDrawingRoom);
  const drawDraftVertices = useEditorStore((s) => s.drawDraftVertices);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--panel)] px-4 py-3">
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          type="button"
          title={tool.hint}
          onClick={() => setTool(tool.id)}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            activeTool === tool.id
              ? "bg-[var(--accent)] text-white"
              : "border border-[var(--border)] hover:bg-[var(--background)]"
          }`}
        >
          {tool.label}
        </button>
      ))}

      <div className="mx-2 h-6 w-px bg-[var(--border)]" />

      <button
        type="button"
        onClick={() => undoAction()}
        disabled={!canUndoAction}
        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-40"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={() => redoAction()}
        disabled={!canRedoAction}
        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-40"
      >
        Redo
      </button>

      {activeTool === "draw-room" && drawDraftVertices.length >= 3 ? (
        <button
          type="button"
          onClick={() => finishDrawingRoom()}
          className="ml-auto rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-500"
        >
          Finish room ({drawDraftVertices.length} points)
        </button>
      ) : null}
    </div>
  );
}
