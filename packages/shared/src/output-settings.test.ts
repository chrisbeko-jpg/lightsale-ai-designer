import { describe, expect, it } from "vitest";
import {
  DEFAULT_OUTPUT_SETTINGS,
  normalizeOutputSettings,
} from "./output-settings.js";
import { normalizeLoadedProjectDocument } from "./document-normalization.js";
import { ProjectSchema } from "./schemas.js";

describe("normalizeOutputSettings", () => {
  it("applies defaults for legacy documents without outputSettings", () => {
    const settings = normalizeOutputSettings(undefined, "Warehouse A");
    expect(settings.customerName).toBe("");
    expect(settings.showFloorPlanBackground).toBe(true);
    expect(settings.projectName).toBe("Warehouse A");
  });

  it("treats null as defaults", () => {
    const settings = normalizeOutputSettings(null);
    expect(settings.showLegend).toBe(DEFAULT_OUTPUT_SETTINGS.showLegend);
  });

  it("merges partial saved settings", () => {
    const settings = normalizeOutputSettings(
      { customerName: "Acme BV", showLegend: false },
      "Fallback",
    );
    expect(settings.customerName).toBe("Acme BV");
    expect(settings.showLegend).toBe(false);
    expect(settings.showRoomOutlines).toBe(
      DEFAULT_OUTPUT_SETTINGS.showRoomOutlines,
    );
  });

  it("rejects invalid types with defaults", () => {
    expect(normalizeOutputSettings("invalid").showScale).toBe(true);
    expect(normalizeOutputSettings([]).showComplianceStatus).toBe(true);
  });
});

describe("normalizeLoadedProjectDocument", () => {
  it("includes outputSettings for legacy JSON", () => {
    const normalized = normalizeLoadedProjectDocument(
      { scale: null, rooms: [] },
      "Legacy project",
    );
    expect(normalized.outputSettings.projectName).toBe("Legacy project");
    expect(normalized.luminaires).toEqual([]);
  });

  it("normalizes null outputSettings", () => {
    const normalized = normalizeLoadedProjectDocument({
      scale: null,
      rooms: [],
      outputSettings: null,
    });
    expect(normalized.outputSettings).toEqual(
      expect.objectContaining({ showLegend: true }),
    );
  });
});

describe("ProjectSchema", () => {
  const baseProject = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Test",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    floorPlan: null,
  };

  it("parses project when document.outputSettings.projectName is null", () => {
    const parsed = ProjectSchema.parse({
      ...baseProject,
      document: {
        scale: null,
        rooms: [],
        luminaires: [],
        outputSettings: {
          projectName: null,
          showLegend: true,
        },
      },
    });
    expect(parsed.document.outputSettings.projectName).toBeUndefined();
    expect(parsed.document.outputSettings.showLegend).toBe(true);
  });

  it("parses project when document.outputSettings is null", () => {
    const parsed = ProjectSchema.parse({
      ...baseProject,
      document: {
        scale: null,
        rooms: [],
        luminaires: [],
        outputSettings: null,
      },
    });
    expect(parsed.document.outputSettings.showLegend).toBe(true);
  });

  it("preserves complete valid outputSettings", () => {
    const parsed = ProjectSchema.parse({
      ...baseProject,
      document: {
        scale: null,
        rooms: [],
        luminaires: [],
        outputSettings: {
          customerName: "Acme",
          showLegend: false,
        },
      },
    });
    expect(parsed.document.outputSettings.customerName).toBe("Acme");
    expect(parsed.document.outputSettings.showLegend).toBe(false);
    expect(parsed.document.outputSettings.showScale).toBe(true);
  });
});
