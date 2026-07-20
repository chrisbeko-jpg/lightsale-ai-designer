import { describe, expect, it } from "vitest";
import {
  buildLightingPlanPdfFilename,
  extractPdfProjectMetadata,
  PDF_DISCLAIMER,
} from "./pdf-export-meta.js";
import { DEFAULT_OUTPUT_SETTINGS } from "./output-settings.js";

describe("buildLightingPlanPdfFilename", () => {
  it("uses project slug and lichtplan suffix", () => {
    expect(buildLightingPlanPdfFilename("Warehouse A")).toBe(
      "Warehouse-A-lichtplan.pdf",
    );
  });

  it("falls back when name is empty", () => {
    expect(buildLightingPlanPdfFilename("   ")).toBe("untitled-lichtplan.pdf");
  });
});

describe("extractPdfProjectMetadata", () => {
  it("includes customer and reference from output settings", () => {
    const meta = extractPdfProjectMetadata(
      {
        ...DEFAULT_OUTPUT_SETTINGS,
        customerName: "Acme",
        projectReference: "REF-1",
        projectName: "Plan X",
      },
      "Fallback",
    );
    expect(meta.customerName).toBe("Acme");
    expect(meta.projectReference).toBe("REF-1");
    expect(meta.projectName).toBe("Plan X");
  });
});

describe("PDF_DISCLAIMER", () => {
  it("mentions indicative design", () => {
    expect(PDF_DISCLAIMER.toLowerCase()).toContain("indicative");
  });
});
