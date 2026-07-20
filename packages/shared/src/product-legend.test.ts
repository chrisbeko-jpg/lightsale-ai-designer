import { describe, expect, it } from "vitest";
import { buildProductLegend } from "./product-legend.js";
import { getProductDisplayColor } from "./product-colors.js";

describe("buildProductLegend", () => {
  it("builds sorted unique legend entries with colours", () => {
    const legend = buildProductLegend([
      "demo-panel-office-36w",
      "demo-downlight-evo-12w",
      "demo-downlight-evo-12w",
    ]);
    expect(legend).toHaveLength(2);
    expect(legend[0]?.color).toBe(
      getProductDisplayColor(legend[0]!.productId),
    );
    expect(legend[0]!.label.length).toBeGreaterThan(0);
  });
});
