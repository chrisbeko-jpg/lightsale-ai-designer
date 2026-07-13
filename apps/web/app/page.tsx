import Link from "next/link";
import { listProjects } from "@/lib/api/projects";
import { CreateProjectForm } from "@/components/CreateProjectForm";
import { ProjectList } from "@/components/ProjectList";

export default async function HomePage() {
  const projects = await listProjects().catch(() => []);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Lightsale AI Designer
        </h1>
        <p className="text-[var(--muted)]">
          Create a lighting project, upload a floor plan, and define rooms.
        </p>
      </header>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-6">
        <h2 className="mb-4 text-lg font-medium">New project</h2>
        <CreateProjectForm />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Projects</h2>
        <ProjectList projects={projects} />
      </section>

      <footer className="text-sm text-[var(--muted)]">
        <Link href="/" className="hover:text-white">
          Lightsale AI Designer
        </Link>
      </footer>
    </main>
  );
}
