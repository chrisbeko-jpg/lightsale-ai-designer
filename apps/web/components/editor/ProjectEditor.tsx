"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LightsaleLogo } from "@/components/brand/LightsaleLogo";
import {
  floorPlanFileUrl,
  getProject,
  updateProjectDocument,
} from "@/lib/api/projects";
import { useEditorStore } from "@/lib/editor/store";
import { canvasHostRectFromDomRect } from "@/lib/editor/canvas-coords";
import {
  PlacementMessageToast,
  ProductDragController,
} from "./ProductDragController";
import { EditorToolbar } from "./EditorToolbar";
import { FloorPlanCanvas } from "./FloorPlanCanvasClient";
import { EditorPropertiesPanel } from "./properties/EditorPropertiesPanel";

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
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const setCanvasHostRect = useEditorStore((s) => s.setCanvasHostRect);
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
    const host = canvasHostRef.current;
    if (!host) {
      return;
    }
    function updateSize() {
      const element = canvasHostRef.current;
      if (!element) {
        return;
      }
      const rect = element.getBoundingClientRect();
      setCanvasSize({
        width: Math.max(400, Math.floor(rect.width)),
        height: Math.max(400, Math.floor(rect.height)),
      });
      setCanvasHostRect(canvasHostRectFromDomRect(rect));
    }
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(host);
    window.addEventListener("scroll", updateSize, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateSize, true);
    };
  }, [setCanvasHostRect]);

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
    <div className="flex h-screen max-h-screen flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--panel)] px-4 py-3">
        <div className="flex items-center gap-4">
          <LightsaleLogo className="hidden h-8 w-auto sm:block" width={100} height={28} />
          <Link
            href="/"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            ← Projects
          </Link>
          <h1 className="font-medium text-[var(--charcoal)]">
            {projectName || "Loading…"}
          </h1>
          {isDirty ? (
            <span className="text-xs text-amber-400">Unsaved changes</span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving || !isDirty}
          className="rounded-lg bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-[var(--charcoal)] disabled:opacity-40"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </header>

      <EditorToolbar />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <EditorPropertiesPanel
          projectId={projectId}
          saveError={saveError}
          floorPlanHint={!floorPlanUrl}
        />
        <div ref={canvasHostRef} className="relative min-w-0 flex-1 overflow-hidden">
          <ProductDragController />
          <PlacementMessageToast />
          <FloorPlanCanvas width={canvasSize.width} height={canvasSize.height} />
        </div>
      </div>
    </div>
  );
}
