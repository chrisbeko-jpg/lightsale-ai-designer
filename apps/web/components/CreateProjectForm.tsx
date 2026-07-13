"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/lib/api/projects";

export function CreateProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = name.trim();
      if (!trimmed) {
        setError("Enter a project name");
        return;
      }
      setIsSubmitting(true);
      setError(null);
      try {
        const project = await createProject({ name: trimmed });
        router.push(`/projects/${project.id}`);
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Could not create project",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, router],
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Project name"
        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 outline-none focus:border-[var(--accent)]"
        maxLength={200}
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-[var(--accent)] px-5 py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        {isSubmitting ? "Creating…" : "Create project"}
      </button>
      {error ? <p className="text-sm text-red-400 sm:basis-full">{error}</p> : null}
    </form>
  );
}
