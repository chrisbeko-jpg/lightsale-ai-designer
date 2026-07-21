import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Lightsale theme tokens", () => {
  it("defines yellow/grey CSS variables in globals.css", () => {
    const cssPath = path.join(
      process.cwd(),
      "apps/web/app/globals.css",
    );
    const css = fs.readFileSync(cssPath, "utf8");
    expect(css).toContain("--accent: #f2c94c");
    expect(css).toContain("--charcoal: #2e3135");
    expect(css).toContain("--background: #f5f6f7");
  });
});
