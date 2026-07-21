import { describe, expect, it } from "vitest";
import { WL_LIGHTING_PRODUCTS, WL_PRODUCT_IDS } from "./wl-products.js";

describe("WL catalogue", () => {
  it("contains all eight specified products", () => {
    const ids = [
      "wl-milano-s",
      "wl-milano-xl",
      "wl-palermo",
      "wl-bari-small",
      "wl-bari-large",
      "wl-gela-tube",
      "wl-spark-595",
      "wl-spark-1195",
    ];
    for (const id of ids) {
      expect(WL_PRODUCT_IDS.has(id)).toBe(true);
    }
    expect(WL_LIGHTING_PRODUCTS).toHaveLength(8);
  });

  it("uses WL brand and stable article numbers", () => {
    for (const product of WL_LIGHTING_PRODUCTS) {
      expect(product.brand).toBe("WL");
      expect(product.articleNumber).toMatch(/^WL-/);
    }
  });
});
