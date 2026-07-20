/** Okabe–Ito–inspired, colour-blind-friendly palette for product identification. */
export const PRODUCT_DISPLAY_COLOR_PALETTE = [
  "#0072B2",
  "#E69F00",
  "#009E73",
  "#CC79A7",
  "#56B4E9",
  "#D55E00",
  "#F0E442",
  "#000000",
] as const;

function stableProductColorIndex(productId: string): number {
  let hash = 0;
  for (let index = 0; index < productId.length; index += 1) {
    hash = (hash * 31 + productId.charCodeAt(index)) >>> 0;
  }
  return hash % PRODUCT_DISPLAY_COLOR_PALETTE.length;
}

/** Same product id always maps to the same display colour. */
export function getProductDisplayColor(productId: string): string {
  return PRODUCT_DISPLAY_COLOR_PALETTE[stableProductColorIndex(productId)]!;
}

export function buildProductColorMap(
  productIds: readonly string[],
): Map<string, string> {
  const unique = [...new Set(productIds)];
  const map = new Map<string, string>();
  for (const productId of unique) {
    map.set(productId, getProductDisplayColor(productId));
  }
  return map;
}

export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized.slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
