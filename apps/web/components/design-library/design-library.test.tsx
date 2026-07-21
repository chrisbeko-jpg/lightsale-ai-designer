/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { designLibraryStatusLabel } from "@/lib/design-library-labels";

describe("Design Library labels", () => {
  it("exposes Dutch status for approved reference", () => {
    expect(designLibraryStatusLabel.approved_reference).toBe(
      "Goedgekeurd als referentie",
    );
  });
});
