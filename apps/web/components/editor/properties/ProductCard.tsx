"use client";

import type { LightingProduct } from "@lightsale/shared";
import {
  formatBeamAngle,
  formatColourTemperature,
  getProductDisplayColor,
  productCategoryLabel,
} from "@lightsale/shared";
import { ProductThumbnail } from "./ProductThumbnail";

interface ProductCardProps {
  product: LightingProduct;
  selected: boolean;
  onSelect: () => void;
}

export function ProductCard({ product, selected, onSelect }: ProductCardProps) {
  const colourTemp = formatColourTemperature(product.colourTemperatureKelvin);
  const beam = formatBeamAngle(product.beamAngleDegrees);
  const accent = getProductDisplayColor(product.id);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border p-2 text-left transition-colors ${
        selected
          ? "border-[var(--accent)] bg-[var(--accent)]/10"
          : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--muted)]"
      }`}
      style={selected ? { boxShadow: `inset 0 0 0 1px ${accent}` } : undefined}
    >
      <div className="flex gap-2">
        <ProductThumbnail product={product} size={64} />
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
            {product.brand}
          </p>
          <p className="line-clamp-2 text-xs font-medium leading-snug text-white">
            {product.name}
          </p>
          <p className="text-[10px] text-[var(--muted)]">
            {product.articleNumber ?? "—"} · {productCategoryLabel(product.category)}
          </p>
          <p className="text-[10px] text-[var(--foreground)]">
            {product.luminousFluxLumens.toLocaleString("en-GB")} lm ·{" "}
            {product.powerWatts} W
            {colourTemp ? ` · ${colourTemp}` : ""}
            {beam ? ` · ${beam}` : ""}
          </p>
        </div>
      </div>
    </button>
  );
}
