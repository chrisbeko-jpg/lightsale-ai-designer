/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectLuxSummary } from "./ProjectLuxSummary";

const roomId = "550e8400-e29b-41d4-a716-446655440000";

describe("ProjectLuxSummary theme", () => {
  it("uses dark panel backgrounds, not white-on-white", () => {
    const { container } = render(
      <ProjectLuxSummary
        scale={{
          pointA: { x: 0, y: 0 },
          pointB: { x: 100, y: 0 },
          realDistanceMetres: 10,
        }}
        rooms={[
          {
            id: roomId,
            name: "Office",
            vertices: [
              { x: 0, y: 0 },
              { x: 100, y: 0 },
              { x: 100, y: 100 },
              { x: 0, y: 100 },
            ],
            roomType: "open_office",
            ceilingHeightMetres: 3,
            ceilingType: "exposed",
            targetLux: 500,
            stylePreset: "functional",
            selectedProductId: "demo-downlight-evo-12w",
            utilisationFactor: 0.6,
            maintenanceFactor: 0.8,
          },
        ]}
        luminaires={[
          {
            id: "lum-1",
            roomId,
            productId: "demo-downlight-evo-12w",
            x: 50,
            y: 50,
            rotationDegrees: 0,
            placementSource: "manual",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ]}
      />,
    );
    expect(container.querySelector(".bg-white")).toBeNull();
    expect(screen.getByText("Office")).toBeTruthy();
    expect(screen.getByText(/Meets target|Below target/)).toBeTruthy();
  });
});
