"use client";

import { useCallback, useRef, useState } from "react";
import { uploadFloorPlan } from "@/lib/api/projects";
import { useEditorStore } from "@/lib/editor/store";

const ACCEPT = ".pdf,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf";

interface FloorPlanUploadProps {
  projectId: string;
}

export function FloorPlanUpload({ projectId }: FloorPlanUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const loadProject = useEditorStore((s) => s.loadProject);

  const handleFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setError(null);
      try {
        const project = await uploadFloorPlan(projectId, file);
        const { floorPlanFileUrl } = await import("@/lib/api/projects");
        loadProject(project, floorPlanFileUrl(projectId));
      } catch (uploadError) {
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "Upload failed",
        );
      } finally {
        setIsUploading(false);
      }
    },
    [projectId, loadProject],
  );

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleFile(file);
          }
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--background)] disabled:opacity-50"
      >
        {isUploading ? "Uploading…" : "Upload floor plan (PDF, PNG, JPG)"}
      </button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
