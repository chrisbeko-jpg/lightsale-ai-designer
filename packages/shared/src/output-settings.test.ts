import { describe, expect, it } from "vitest";
import {
  DEFAULT_OUTPUT_SETTINGS,
  normalizeOutputSettings,
} from "./output-settings.js";
import { normalizeLoadedProjectDocument } from "./document-normalization.js";

describe("normalizeOutputSettings", () => {
  it("applies defaults for legacy documents without outputSettings", () => {
    const settings = normalizeOutputSettings(undefined, "Warehouse A");
    expect(settings.customerName).toBe("");
    expect(settings.showFloorPlanBackground).toBe(true);
    expect(settings.projectName).toBe("Warehouse A");
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
});
