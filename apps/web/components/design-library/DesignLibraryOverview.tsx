"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  deleteDesignLibraryProject,
  duplicateDesignLibraryProject,
  listDesignLibraryProjects,
  type DesignLibraryListItem,
} from "@/lib/api/design-library";
import {
  designLibraryProjectTypeLabel,
  designLibraryStatusLabel,
} from "@/lib/design-library-labels";
import { DESIGN_LIBRARY_PROJECT_TYPES } from "@lightsale/shared";

export function DesignLibraryOverview() {
  const router = useRouter();
  const [items, setItems] = useState<DesignLibraryListItem[]>([]);
  const [q, setQ] = useState("");
  const [projectType, setProjectType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listDesignLibraryProjects({
        q: q || undefined,
        projectType: projectType || undefined,
      });
      setItems(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Laden mislukt",
      );
    } finally {
      setLoading(false);
    }
  }, [q, projectType]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Design Library</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Bewaar en beheer referentieprojecten voor toekomstige AI-voorstellen.
          </p>
        </div>
        <Link
          href="/design-library/new"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#17191c] hover:bg-[var(--accent-hover)]"
        >
          + Nieuw referentieproject
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[var(--border)]">
        <Link
          href="/design-library"
          className="border-b-2 border-[var(--accent)] px-3 py-2 text-sm text-white"
        >
          Referentieprojecten
        </Link>
        <Link
          href="/design-library/notes"
          className="px-3 py-2 text-sm text-zinc-400 hover:text-white"
        >
          Ontwerpnotities
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoeken op naam, klant, product, interpretatie…"
          className="min-w-[220px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-white"
        />
        <select
          value={projectType}
          onChange={(e) => setProjectType(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-white"
        >
          <option value="">Alle projecttypen</option>
          {DESIGN_LIBRARY_PROJECT_TYPES.map((type) => (
            <option key={type} value={type}>
              {designLibraryProjectTypeLabel[type]}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="rounded border border-[var(--error)] bg-[var(--panel)] p-3 text-sm text-[var(--error)]">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Laden…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--panel)] p-8 text-center">
          <p className="text-white">Nog geen referentieprojecten</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Upload een eerdere lichtontwerp-case om later als referentie te gebruiken.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-medium text-white">{item.name}</h2>
                  <p className="text-xs text-[var(--muted)]">
                    {designLibraryProjectTypeLabel[
                      item.projectType as keyof typeof designLibraryProjectTypeLabel
                    ] ?? item.projectType}
                    {item.year ? ` · ${item.year}` : ""}
                  </p>
                </div>
                <span className="rounded bg-[var(--background)] px-2 py-0.5 text-[10px] text-[var(--accent)]">
                  {designLibraryStatusLabel[
                    item.status as keyof typeof designLibraryStatusLabel
                  ] ?? item.status}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                <dt className="text-[var(--muted)]">Ruimtes</dt>
                <dd className="text-right text-white">{item.roomCount}</dd>
                <dt className="text-[var(--muted)]">Bestanden</dt>
                <dd className="text-right text-white">{item.fileCount}</dd>
                <dt className="text-[var(--muted)]">Gewijzigd</dt>
                <dd className="text-right text-zinc-300">
                  {new Date(item.updatedAt).toLocaleDateString("nl-NL")}
                </dd>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/design-library/${item.id}`)}
                  className="rounded border border-[var(--border)] px-2 py-1 text-xs text-white hover:border-[var(--accent)]"
                >
                  Openen
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const copy = await duplicateDesignLibraryProject(item.id);
                    router.push(`/design-library/${copy.id}`);
                  }}
                  className="rounded border border-[var(--border)] px-2 py-1 text-xs text-zinc-300 hover:text-white"
                >
                  Dupliceren
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await deleteDesignLibraryProject(item.id);
                    await load();
                  }}
                  className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--error)]"
                >
                  Verwijderen
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
