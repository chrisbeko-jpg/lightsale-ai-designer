"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createDesignNote, listDesignNotes } from "@/lib/api/design-library";
import type { DesignNote } from "@lightsale/shared";
import { fieldClassName, labelClassName } from "@/components/editor/properties/editor-form-styles";

export function DesignNotesPanel() {
  const [notes, setNotes] = useState<DesignNote[]>([]);
  const [title, setTitle] = useState("");
  const [ruleText, setRuleText] = useState("");
  const [q, setQ] = useState("");

  const load = async () => {
    setNotes(await listDesignNotes(q || undefined));
  };

  useEffect(() => {
    void load();
  }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-[var(--border)]">
        <Link
          href="/design-library"
          className="px-3 py-2 text-sm text-zinc-400 hover:text-white"
        >
          Referentieprojecten
        </Link>
        <Link
          href="/design-library/notes"
          className="border-b-2 border-[var(--accent)] px-3 py-2 text-sm text-white"
        >
          Ontwerpnotities
        </Link>
      </div>

      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Zoek in notities…"
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-white"
      />

      <section className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
        <h2 className="text-sm font-medium text-[var(--accent)]">Nieuwe ontwerpnotitie</h2>
        <label className={`${labelClassName} mt-3 block`}>
          Titel
          <input className={fieldClassName} value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className={`${labelClassName} mt-2 block`}>
          Regeltekst
          <textarea
            className={`${fieldClassName} min-h-[100px]`}
            value={ruleText}
            onChange={(e) => setRuleText(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="mt-3 rounded bg-[var(--accent)] px-3 py-2 text-sm text-[#17191c]"
          onClick={async () => {
            if (!title.trim() || !ruleText.trim()) return;
            await createDesignNote({ title, ruleText, status: "active" });
            setTitle("");
            setRuleText("");
            await load();
          }}
        >
          Notitie opslaan
        </button>
      </section>

      <ul className="space-y-2">
        {notes.map((note) => (
          <li
            key={note.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4"
          >
            <h3 className="font-medium text-white">{note.title}</h3>
            <p className="mt-2 text-sm text-zinc-300">{note.ruleText}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
