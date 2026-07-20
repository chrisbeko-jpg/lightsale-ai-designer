/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { jsPDF } from "jspdf";
import { buildLightingPlanPdfFilename } from "@lightsale/shared";

describe("PDF export", () => {
  it("generates a non-empty PDF blob via jsPDF", () => {
    const doc = new jsPDF();
    doc.text("Lightsale test", 10, 10);
    const blob = doc.output("blob");
    expect(blob.size).toBeGreaterThan(500);
  });

  it("uses lichtplan filename convention", () => {
    expect(buildLightingPlanPdfFilename("Demo Project")).toContain("lichtplan.pdf");
  });
});
