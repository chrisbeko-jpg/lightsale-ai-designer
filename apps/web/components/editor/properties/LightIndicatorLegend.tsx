"use client";

import { LIGHT_INDICATOR_LEGEND_ITEMS } from "@/lib/heatmap/heatmap-intensity-colors";
import { sectionClassName } from "./editor-form-styles";

interface LightIndicatorLegendProps {
  showToggle?: boolean;
  checked?: boolean;
  onToggle?: (checked: boolean) => void;
}

export function LightIndicatorLegend({
  showToggle = false,
  checked = false,
  onToggle,
}: LightIndicatorLegendProps) {
  return (
    <div className={sectionClassName}>
      <h4 className="text-xs font-medium text-[var(--accent)]">Indicatieve dekking</h4>
      {showToggle ? (
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-zinc-200">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => onToggle?.(event.target.checked)}
            className="rounded border-[var(--border)]"
          />
          Light Indicator op plattegrond tonen
        </label>
      ) : null}
      <ul className="mt-2 space-y-1.5">
        {LIGHT_INDICATOR_LEGEND_ITEMS.map((item) => (
          <li
            key={item.label}
            className="flex items-center gap-2 text-[10px] leading-snug text-zinc-300"
          >
            <span
              className={`h-3 w-3 shrink-0 rounded-sm ${
                item.swatch === "transparent"
                  ? "border border-[var(--border)] bg-[var(--background)]"
                  : ""
              }`}
              style={
                item.swatch !== "transparent"
                  ? { backgroundColor: item.swatch }
                  : undefined
              }
              aria-hidden
            />
            {item.label}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] leading-snug text-[var(--muted)]">
        Indicatief — geen geverifieerde uniformiteit of compliance.
      </p>
    </div>
  );
}
