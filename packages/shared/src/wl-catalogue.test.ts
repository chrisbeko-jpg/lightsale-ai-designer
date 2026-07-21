import { describe, expect, it } from "vitest";
import { filterCompatibleProducts } from "./luminaire-quantity.js";
import { getCatalogProducts } from "./product-catalog.js";
import { defaultRoomPropertyFields } from "./schemas.js";
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

  it("lists all products for any room type and style (sample catalogue)", () => {
    const base = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Test",
      vertices: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
      ],
      ...defaultRoomPropertyFields(),
    };
    expect(
      filterCompatibleProducts(getCatalogProducts(), {
        ...base,
        roomType: "bathroom",
      }),
    ).toHaveLength(8);
    expect(
      filterCompatibleProducts(getCatalogProducts(), {
        ...base,
        roomType: "technical_room",
      }),
    ).toHaveLength(8);
    expect(
      filterCompatibleProducts(getCatalogProducts(), {
        ...base,
        stylePreset: "hotel_chic",
      }),
    ).toHaveLength(8);
    expect(filterCompatibleProducts(getCatalogProducts(), base)).toHaveLength(8);
  });
});
