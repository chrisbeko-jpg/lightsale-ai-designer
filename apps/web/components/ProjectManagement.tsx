"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { ProjectListItem } from "@/lib/api/projects";
import {
  duplicateProject,
  fetchProjectTrashStats,
  listProjects,
  permanentlyDeleteProject,
  renameProject,
  restoreProject,
  trashProject,
} from "@/lib/api/projects";
import {
  dangerButtonClassName,
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/editor/properties/editor-form-styles";

interface ProjectManagementProps {
  initialProjects: ProjectListItem[];
}

export function ProjectManagement({ initialProjects }: ProjectManagementProps) {
  const router = useRouter();
  const [activeProjects, setActiveProjects] = useState(initialProjects);
  const [trashProjects, setTrashProjects] = useState<ProjectListItem[]>([]);
  const [showTrash, setShowTrash] = useState(false);
  const [stats, setStats] = useState<{
    active: number;
    trash: number;
    bytes: number | null;
  } | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProjectListItem | null>(null);
  const [pendingPermanent, setPendingPermanent] = useState<ProjectListItem | null>(null);
  const [renameTarget, setRenameTarget] = useState<ProjectListItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [active, trash, trashStats] = await Promise.all([
      listProjects(false),
      listProjects(true),
      fetchProjectTrashStats(),
    ]);
    setActiveProjects(active);
    setTrashProjects(trash);
    setStats({
      active: trashStats.activeProjectCount,
      trash: trashStats.trashProjectCount,
      bytes: trashStats.totalUploadedBytes,
    });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const projects = showTrash ? trashProjects : activeProjects;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refresh();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowTrash(false)}
            className={`rounded px-3 py-1.5 text-sm ${
              !showTrash
                ? "bg-[var(--accent)] text-[#17191c] font-medium"
                : "border border-[var(--border)] text-[var(--text-secondary)]"
            }`}
          >
            Active projects
          </button>
          <button
            type="button"
            onClick={() => setShowTrash(true)}
            className={`rounded px-3 py-1.5 text-sm ${
              showTrash
                ? "bg-[var(--accent)] text-[#17191c] font-medium"
                : "border border-[var(--border)] text-[var(--text-secondary)]"
            }`}
          >
            Trash ({stats?.trash ?? trashProjects.length})
          </button>
        </div>
        {stats ? (
          <p className="text-xs text-[var(--muted)]">
            {stats.active} active · {stats.trash} in trash
            {stats.bytes !== null ? ` · ${Math.round(stats.bytes / 1024)} KB uploads` : ""}
          </p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-[var(--error)]">{error}</p> : null}

      {projects.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-[var(--muted)]">
          {showTrash ? "Trash is empty." : "No projects yet. Create one above to get started."}
        </p>
      ) : (
        <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--panel)]">
          {projects.map((project) => (
            <li key={project.id} className="relative px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-[var(--foreground)]">{project.name}</p>
                  <p className="text-sm text-[var(--muted)]">
                    Updated {new Date(project.updatedAt).toLocaleString()}
                  </p>
                  {project.customerName ? (
                    <p className="text-xs text-[var(--text-secondary)]">
                      Customer: {project.customerName}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--muted)]">
                    {project.roomCount} rooms · {project.luminaireCount} luminaires
                  </span>
                  {!showTrash ? (
                    <Link
                      href={`/projects/${project.id}`}
                      className={secondaryButtonClassName + " !w-auto px-3 py-1 text-xs"}
                    >
                      Open
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--foreground)]"
                    onClick={() =>
                      setMenuOpenId(menuOpenId === project.id ? null : project.id)
                    }
                  >
                    ⋮
                  </button>
                </div>
              </div>
              {menuOpenId === project.id ? (
                <div className="absolute right-5 top-14 z-10 min-w-[10rem] rounded border border-[var(--border)] bg-[var(--panel-elevated)] py-1 shadow-lg">
                  {!showTrash ? (
                    <>
                      <Link
                        href={`/projects/${project.id}`}
                        className="block px-3 py-2 text-sm hover:bg-[var(--panel-hover)]"
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--panel-hover)]"
                        onClick={() => {
                          setRenameTarget(project);
                          setRenameValue(project.name);
                          setMenuOpenId(null);
                        }}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--panel-hover)]"
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await duplicateProject(project.id);
                            setMenuOpenId(null);
                          })
                        }
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm text-[var(--error)] hover:bg-[var(--panel-hover)]"
                        onClick={() => {
                          setPendingDelete(project);
                          setMenuOpenId(null);
                        }}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--panel-hover)]"
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await restoreProject(project.id);
                            setMenuOpenId(null);
                          })
                        }
                      >
                        Restore
                      </button>
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm text-[var(--error)] hover:bg-[var(--panel-hover)]"
                        onClick={() => {
                          setPendingPermanent(project);
                          setMenuOpenId(null);
                        }}
                      >
                        Permanently delete
                      </button>
                    </>
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {pendingDelete ? (
        <dialog open className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded border border-[var(--border)] bg-[var(--panel-elevated)] p-5">
            <h3 className="text-lg font-medium">Delete lighting plan?</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              <strong>{pendingDelete.name}</strong>
              {pendingDelete.customerName ? ` · ${pendingDelete.customerName}` : ""}
            </p>
            <ul className="mt-2 text-xs text-[var(--muted)]">
              <li>Last modified: {new Date(pendingDelete.updatedAt).toLocaleString()}</li>
              <li>Rooms: {pendingDelete.roomCount}</li>
              <li>Luminaires: {pendingDelete.luminaireCount}</li>
            </ul>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className={secondaryButtonClassName + " !w-auto px-4"} onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={dangerButtonClassName}
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await trashProject(pendingDelete.id);
                    setPendingDelete(null);
                  })
                }
              >
                Delete lighting plan
              </button>
            </div>
          </div>
        </dialog>
      ) : null}

      {pendingPermanent ? (
        <dialog open className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded border border-[var(--error)] bg-[var(--panel-elevated)] p-5">
            <h3 className="text-lg font-medium text-[var(--error)]">Permanent delete</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              This lighting plan and its project files will be permanently deleted. This action
              cannot be undone.
            </p>
            <p className="mt-2 font-medium">{pendingPermanent.name}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className={secondaryButtonClassName + " !w-auto px-4"} onClick={() => setPendingPermanent(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={dangerButtonClassName}
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await permanentlyDeleteProject(pendingPermanent.id);
                    setPendingPermanent(null);
                  })
                }
              >
                Permanently delete
              </button>
            </div>
          </div>
        </dialog>
      ) : null}

      {renameTarget ? (
        <dialog open className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded border border-[var(--border)] bg-[var(--panel-elevated)] p-5">
            <h3 className="text-lg font-medium">Rename project</h3>
            <input
              className={`${fieldClassName} mt-3`}
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              maxLength={200}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className={secondaryButtonClassName + " !w-auto px-4"} onClick={() => setRenameTarget(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={primaryButtonClassName + " !w-auto px-4"}
                disabled={busy || renameValue.trim().length === 0}
                onClick={() =>
                  void run(async () => {
                    await renameProject(renameTarget.id, renameValue.trim());
                    setRenameTarget(null);
                  })
                }
              >
                Save
              </button>
            </div>
          </div>
        </dialog>
      ) : null}
    </div>
  );
}
