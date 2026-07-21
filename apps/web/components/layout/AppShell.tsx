"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/projects", label: "Projecten" },
  { href: "/products", label: "Producten" },
  { href: "/design-library", label: "Design Library", icon: "📚" },
  { href: "/settings", label: "Instellingen" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-4">
          <Link href="/projects" className="text-lg font-semibold text-white">
            Lightsale
          </Link>
          <nav className="flex flex-wrap gap-1">
            {NAV.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/projects" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    active
                      ? "bg-[var(--accent)] text-[#17191c]"
                      : "text-zinc-300 hover:bg-[var(--background)] hover:text-white"
                  }`}
                >
                  {"icon" in item ? `${item.icon} ${item.label}` : item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
