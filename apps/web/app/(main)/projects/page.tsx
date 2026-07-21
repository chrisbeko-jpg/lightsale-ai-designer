import { listProjects } from "@/lib/api/projects";
import { CreateProjectForm } from "@/components/CreateProjectForm";
import { ProjectManagement } from "@/components/ProjectManagement";

export default async function ProjectsPage() {
  const projects = await listProjects().catch(() => []);

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Projecten
        </h1>
        <p className="text-[var(--muted)]">
          Maak een lichtplan, upload een plattegrond en definieer ruimtes.
        </p>
      </header>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-6">
        <h2 className="mb-4 text-lg font-medium text-white">Nieuw project</h2>
        <CreateProjectForm />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-white">Actieve projecten</h2>
        <ProjectManagement initialProjects={projects} />
      </section>
    </div>
  );
}
