/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ProductCard } from "./ProductCard";
import { getCatalogProducts } from "@lightsale/shared";
import { useEditorStore } from "@/lib/editor/store";

describe("ProductCard", () => {
  afterEach(() => cleanup());

  const product = getCatalogProducts().find((p) => p.id === "wl-bari-small");
  if (!product) {
    throw new Error("fixture product missing");
  }

  it("shows product info and thumbnail", () => {
    render(
      <ProductCard
        product={product}
        roomId="room-1"
        selected={false}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText(product.brand)).toBeTruthy();
    expect(screen.getByText(/Bari Small/)).toBeTruthy();
    expect(screen.getByTitle("Downlight")).toBeTruthy();
  });

  it("exposes drag handle for floor plan placement", () => {
    render(
      <ProductCard
        product={product}
        roomId="room-1"
        selected={false}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByTestId("product-drag-handle")).toBeTruthy();
    expect(
      screen.getByLabelText(/Drag WL Bari Small 6W 930 to floor plan/i),
    ).toBeTruthy();
  });

  it("shows placement mode active badge when placementActive", () => {
    render(
      <ProductCard
        product={product}
        roomId="room-1"
        selected
        placementActive
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText("Placement mode active")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
  });
});
