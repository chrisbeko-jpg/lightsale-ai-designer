/** Matches gradient colours used in `drawLightIndicatorHeatmap`. */

export function intensityColor(intensity: number): string {
  const t = Math.min(1, intensity / 3);
  if (t > 0.66) {
    return `rgba(128, 0, 128, ${0.15 + t * 0.25})`;
  }
  if (t > 0.33) {
    return `rgba(255, 105, 180, ${0.12 + t * 0.2})`;
  }
  if (t > 0.08) {
    return `rgba(255, 140, 0, ${0.1 + t * 0.18})`;
  }
  return `rgba(220, 20, 60, ${0.05 + t * 0.12})`;
}

export const LIGHT_INDICATOR_LEGEND_ITEMS = [
  {
    label: "Paars = hoogste indicatieve lichtintensiteit",
    swatch: "rgb(128, 0, 128)",
  },
  {
    label: "Magenta = hoog",
    swatch: "rgb(255, 105, 180)",
  },
  {
    label: "Oranje = gemiddeld",
    swatch: "rgb(255, 140, 0)",
  },
  {
    label: "Rood = laag",
    swatch: "rgb(220, 20, 60)",
  },
  {
    label: "Transparant = geen of minimale bijdrage",
    swatch: "transparent",
  },
] as const;
