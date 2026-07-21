/**
 * @vitest-environment jsdom
 */
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ProductCard } from "@/components/editor/properties/ProductCard";
import { WL_LIGHTING_PRODUCTS } from "@lightsale/shared";

describe("ProductCard", () => {
  afterEach(() => cleanup());

  it("renders brand, lumens and wattage on the card", () => {
    const product = WL_LIGHTING_PRODUCTS[0]!;
    render(
      <ProductCard product={product} selected={false} onSelect={() => undefined} />,
    );
    expect(screen.getByText(product.brand)).toBeTruthy();
    expect(screen.getByText(/lm ·/)).toBeTruthy();
  });
});
