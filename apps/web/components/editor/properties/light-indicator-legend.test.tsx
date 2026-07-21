/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LightIndicatorLegend } from "./LightIndicatorLegend";

describe("LightIndicatorLegend", () => {
  it("uses dark panel styling and readable legend labels", () => {
    const { container } = render(<LightIndicatorLegend />);
    expect(screen.getByText("Indicatieve dekking")).toBeTruthy();
    expect(screen.getByText(/Paars = hoogste indicatieve lichtintensiteit/)).toBeTruthy();
    expect(screen.getByText(/Magenta = hoog/)).toBeTruthy();
    expect(screen.getByText(/Transparant = geen of minimale bijdrage/)).toBeTruthy();
    expect(container.querySelector(".bg-white")).toBeNull();
  });
});
