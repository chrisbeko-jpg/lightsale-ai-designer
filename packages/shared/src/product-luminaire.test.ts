import { describe, expect, it } from "vitest";
import {
  calculateEffectiveLumensPerLuminaire,
  calculateIndicativeLuminaireEstimate,
  calculateIndicativeLuminaireQuantity,
  filterCompatibleProducts,
  isProductCompatibleWithRoom,
} from "./luminaire-quantity.js";
import { DEMO_LIGHTING_PRODUCTS, getProductById } from "./product-catalog.js";
import { normalizeRoom } from "./schemas.js";

const baseRoom = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Test room",
  vertices: [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ],
};

describe("filterCompatibleProducts", () => {
  it("returns products matching room type and style preset", () => {
    const compatible = filterCompatibleProducts(DEMO_LIGHTING_PRODUCTS, {
      roomType: "open_office",
      stylePreset: "functional",
    });
    expect(compatible.length).toBeGreaterThan(0);
    expect(
      compatible.every((product) =>
        isProductCompatibleWithRoom(product, {
          roomType: "open_office",
          stylePreset: "functional",
        }),
      ),
    ).toBe(true);
  });

  it("excludes products that do not match room type", () => {
    const wetProduct = getProductById("demo-downlight-wet-15w");
    expect(wetProduct).toBeDefined();
    const compatible = filterCompatibleProducts(DEMO_LIGHTING_PRODUCTS, {
      roomType: "open_office",
      stylePreset: "functional",
    });
    expect(compatible.some((p) => p.id === wetProduct?.id)).toBe(false);
  });
});

describe("calculateEffectiveLumensPerLuminaire", () => {
  it("multiplies flux by utilisation and maintenance factors", () => {
    expect(calculateEffectiveLumensPerLuminaire(1000, 0.6, 0.8)).toBe(480);
  });

  it("returns null for invalid factors", () => {
    expect(calculateEffectiveLumensPerLuminaire(1000, 0, 0.8)).toBeNull();
  });
});

describe("calculateIndicativeLuminaireQuantity", () => {
  it("rounds up to whole luminaires", () => {
    expect(calculateIndicativeLuminaireQuantity(20, 300, 480)).toBe(13);
  });

  it("returns exact integer when evenly divisible", () => {
    expect(calculateIndicativeLuminaireQuantity(10, 200, 500)).toBe(4);
  });
});

describe("calculateIndicativeLuminaireEstimate", () => {
  it("returns null quantity when no product is selected", () => {
    const estimate = calculateIndicativeLuminaireEstimate({
      roomAreaSquareMetres: 20,
      room: {
        roomType: "kitchen",
        targetLux: null,
        utilisationFactor: 0.6,
        maintenanceFactor: 0.8,
        selectedProductId: null,
      },
      product: null,
    });
    expect(estimate.quantity).toBeNull();
    expect(estimate.effectiveLumensPerLuminaire).toBeNull();
  });

  it("computes quantity and total wattage for a selected product", () => {
    const product = getProductById("demo-downlight-evo-12w");
    expect(product).toBeDefined();
    const estimate = calculateIndicativeLuminaireEstimate({
      roomAreaSquareMetres: 20,
      room: {
        roomType: "kitchen",
        targetLux: null,
        utilisationFactor: 0.6,
        maintenanceFactor: 0.8,
        selectedProductId: product?.id ?? null,
      },
      product,
    });
    expect(estimate.effectiveLumensPerLuminaire).toBe(528);
    expect(estimate.quantity).toBe(12);
    expect(estimate.totalInstalledWatts).toBe(144);
  });
});

describe("legacy room normalization with product fields", () => {
  it("applies default utilisation and maintenance factors", () => {
    const room = normalizeRoom({
      ...baseRoom,
      roomType: "kitchen",
      stylePreset: "functional",
    });
    expect(room.utilisationFactor).toBe(0.6);
    expect(room.maintenanceFactor).toBe(0.8);
    expect(room.selectedProductId).toBeNull();
  });

  it("clears unknown selected product ids", () => {
    const room = normalizeRoom({
      ...baseRoom,
      roomType: "kitchen",
      stylePreset: "functional",
      selectedProductId: "unknown-product",
    });
    expect(room.selectedProductId).toBeNull();
  });

  it("clears incompatible product after room context migration", () => {
    const room = normalizeRoom({
      ...baseRoom,
      roomType: "bathroom",
      stylePreset: "functional",
      selectedProductId: "demo-downlight-evo-12w",
    });
    expect(room.selectedProductId).toBeNull();
  });
});
