"use client";

import dynamic from "next/dynamic";

export const FloorPlanCanvas = dynamic(
  () => import("./FloorPlanCanvas").then((mod) => mod.FloorPlanCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[400px] items-center justify-center bg-[#111820] text-[var(--muted)]">
        Loading canvas…
      </div>
    ),
  },
);
