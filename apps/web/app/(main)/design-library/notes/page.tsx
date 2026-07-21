import { DesignNotesPanel } from "@/components/design-library/DesignNotesPanel";

export default function DesignNotesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold text-white">Design Library</h1>
      <DesignNotesPanel />
    </div>
  );
}
