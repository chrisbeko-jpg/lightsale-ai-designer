import {
  DESIGN_LIBRARY_PROJECT_STATUSES,
  DESIGN_LIBRARY_PROJECT_TYPES,
} from "@lightsale/shared";

export const designLibraryStatusLabel: Record<
  (typeof DESIGN_LIBRARY_PROJECT_STATUSES)[number],
  string
> = {
  concept: "Concept",
  reviewed: "Gecontroleerd",
  approved_reference: "Goedgekeurd als referentie",
  archived: "Gearchiveerd",
};

export const designLibraryProjectTypeLabel: Record<
  (typeof DESIGN_LIBRARY_PROJECT_TYPES)[number],
  string
> = {
  office: "Kantoor",
  residential: "Woning",
  retail: "Retail",
  hospitality: "Horeca",
  industrial: "Industrie",
  education: "Onderwijs",
  healthcare: "Zorg",
  outdoor: "Buitenruimte",
  other: "Overig",
};

export const WIZARD_STEPS = [
  "Projectgegevens",
  "Bestanden",
  "Ruimtes",
  "Ontwerpinterpretatie",
  "Controle en opslaan",
] as const;
