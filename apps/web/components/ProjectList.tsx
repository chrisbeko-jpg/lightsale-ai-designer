import Link from "next/link";
import type { ProjectListItem } from "@/lib/api/projects";

interface ProjectListProps {
  projects: ProjectListItem[];
}

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-[var(--muted)]">
        No projects yet. Create one above to get started.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--panel)]">
      {projects.map((project) => (
        <li key={project.id}>
          <Link
            href={`/projects/${project.id}`}
            className="flex items-center justify-between px-5 py-4 transition hover:bg-[var(--background)]"
          >
            <div>
              <p className="font-medium">{project.name}</p>
              <p className="text-sm text-[var(--muted)]">
                Updated {new Date(project.updatedAt).toLocaleString()}
              </p>
            </div>
            <span className="text-sm text-[var(--muted)]">
              {project.hasFloorPlan ? "Floor plan" : "No floor plan"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
