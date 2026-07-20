import { describe, expect, it } from "vitest";
import {
  buildProductColorMap,
  getProductDisplayColor,
} from "./product-colors.js";

describe("getProductDisplayColor", () => {
  it("returns stable colour for the same product id", () => {
    expect(getProductDisplayColor("demo-downlight-evo-12w")).toBe(
      getProductDisplayColor("demo-downlight-evo-12w"),
    );
  });

  it("may assign different colours to different products", () => {
    const a = getProductDisplayColor("demo-downlight-evo-12w");
    const b = getProductDisplayColor("demo-pendant-soft-40w");
    expect(a).not.toBe(b);
  });
});

describe("buildProductColorMap", () => {
  it("maps each unique product id once", () => {
    const map = buildProductColorMap([
      "demo-downlight-evo-12w",
      "demo-downlight-evo-12w",
      "demo-panel-office-36w",
    ]);
    expect(map.size).toBe(2);
    expect(map.get("demo-downlight-evo-12w")).toBeTruthy();
  });
});
