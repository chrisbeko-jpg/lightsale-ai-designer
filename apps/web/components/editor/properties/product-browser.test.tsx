/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ProductBrowser } from "./ProductBrowser";
import { defaultRoomPropertyFields } from "@lightsale/shared";

const room = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Kantine",
  vertices: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ],
  ...defaultRoomPropertyFields(),
};

describe("ProductBrowser", () => {
  afterEach(() => cleanup());

  it("lists all eight WL catalogue products for a typical room", () => {
    render(<ProductBrowser room={room} onPatch={() => undefined} />);
    expect(screen.getByText(/WL Milano S/)).toBeTruthy();
    expect(screen.getByText(/WL Spark 595/)).toBeTruthy();
    expect(screen.getByText(/WL Gela Tube/)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Drag WL/i })).toHaveLength(8);
  });
});
