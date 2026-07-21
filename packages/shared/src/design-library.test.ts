import { describe, expect, it } from "vitest";
import { normalizeDesignLibraryProjectInput } from "./design-library.js";

describe("design library schemas", () => {
  it("normalizes empty wizard payload with safe defaults", () => {
    const normalized = normalizeDesignLibraryProjectInput({});
    expect(normalized.designer).toBe("Lightsale");
    expect(normalized.status).toBe("concept");
    expect(normalized.rooms).toEqual([]);
    expect(normalized.interpretation).toEqual({});
  });
});
