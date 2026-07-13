"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  floorPlanFileUrl,
  getProject,
  updateProjectDocument,
} from "@/lib/api/projects";
import { useEditorStore } from "@/lib/editor/store";
import { EditorToolbar } from "./EditorToolbar";
import { FloorPlanCanvas } from "./FloorPlanCanvasClient";
import { FloorPlanUpload } from "./FloorPlanUpload";
import { RoomListPanel } from "./RoomListPanel";
import { ScaleCalibrationPanel } from "./ScaleCalibrationPanel";

interface ProjectEditorProps {
  projectId: string;
}

export function ProjectEditor({ projectId }: ProjectEditorProps) {
  const loadProject = useEditorStore((s) => s.loadProject);
  const projectName = useEditorStore((s) => s.projectName);
  const floorPlanUrl = useEditorStore((s) => s.floorPlanUrl);
  const isDirty = useEditorStore((s) => s.isDirty);
  const isSaving = useEditorStore((s) => s.isSaving);
  const getPersistedDocument = useEditorStore((s) => s.getPersistedDocument);
  const markSaved = useEditorStore((s) => s.markSaved);
  const setSaving = useEditorStore((s) => s.setSaving);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const project = await getProject(projectId);
        if (cancelled) {
          return;
        }
        const url = project.floorPlan ? floorPlanFileUrl(projectId) : null;
        loadProject(project, url);
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "Failed to load project",
          );
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId, loadProject]);

  useEffect(() => {
    function updateSize() {
      const sidebarWidth = 320;
      const padding = 0;
      setCanvasSize({
        width: Math.max(400, window.innerWidth - sidebarWidth - padding),
        height: Math.max(400, window.innerHeight - 56),
      });
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateProjectDocument(projectId, getPersistedDocument());
      markSaved();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save project",
      );
    } finally {
      setSaving(false);
    }
  }, [projectId, getPersistedDocument, markSaved, setSaving]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        void handleSave();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          useEditorStore.getState().redo();
        } else {
          useEditorStore.getState().undo();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-400">{loadError}</p>
          <Link href="/" className="mt-4 inline-block text-[var(--accent)]">
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--panel)] px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-[var(--muted)] hover:text-white">
            ← Projects
          </Link>
          <h1 className="font-medium">{projectName || "Loading…"}</h1>
          {isDirty ? (
            <span className="text-xs text-amber-400">Unsaved changes</span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving || !isDirty}
          className="rounded-lg bg-[var(--accent)] px-4 py-1.5 text-sm text-white disabled:opacity-40"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </header>

      <EditorToolbar />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <FloorPlanCanvas width={canvasSize.width} height={canvasSize.height} />
        </div>

        <aside className="w-80 shrink-0 space-y-4 overflow-y-auto border-l border-[var(--border)] bg-[var(--panel)] p-4">
          <FloorPlanUpload projectId={projectId} />
          <ScaleCalibrationPanel />
          <div>
            <h3 className="mb-2 text-sm font-medium">Rooms</h3>
            <RoomListPanel />
          </div>
          {saveError ? (
            <p className="text-xs text-red-400">{saveError}</p>
          ) : null}
          {!floorPlanUrl ? (
            <p className="text-xs text-[var(--muted)]">
              Upload a floor plan to begin. Scroll to zoom. Use Pan tool or
              Shift+drag to pan.
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
