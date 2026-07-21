"use client";

import type { LightingProduct } from "@lightsale/shared";
import {
  formatBeamAngle,
  formatColourTemperature,
  formatProductDimensionsLabel,
  getProductDisplayColor,
  productCategoryLabel,
} from "@lightsale/shared";
import { useEditorStore } from "@/lib/editor/store";
import { ProductThumbnail } from "./ProductThumbnail";

interface ProductCardProps {
  product: LightingProduct;
  roomId: string;
  selected: boolean;
  onSelect: () => void;
}

export function ProductCard({
  product,
  roomId,
  selected,
  onSelect,
}: ProductCardProps) {
  const colourTemp = formatColourTemperature(product.colourTemperatureKelvin);
  const beam = formatBeamAngle(product.beamAngleDegrees);
  const dimensions = formatProductDimensionsLabel(product.dimensions);
  const accent = getProductDisplayColor(product.id);
  const beginProductDrag = useEditorStore((s) => s.beginProductDrag);

  return (
    <div
      className={`w-full rounded-lg border p-2 text-left transition-colors select-none ${
        selected
          ? "border-[var(--accent)] bg-[var(--accent)]/10"
          : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--muted)]"
      }`}
      style={selected ? { boxShadow: `inset 0 0 0 1px ${accent}` } : undefined}
    >
      <div className="flex gap-2">
        <ProductThumbnail product={product} size={64} />
        <button
          type="button"
          onClick={onSelect}
          className="min-w-0 flex-1 space-y-0.5 text-left"
        >
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
            {product.brand}
          </p>
          <p className="line-clamp-2 text-xs font-medium leading-snug text-white">
            {product.name}
          </p>
          <p className="text-[10px] text-[var(--muted)]">
            {productCategoryLabel(product.category)}
            {dimensions ? ` · ${dimensions}` : ""}
          </p>
          <p className="text-[10px] text-[var(--foreground)]">
            {product.luminousFluxLumens.toLocaleString("en-GB")} lm ·{" "}
            {product.powerWatts} W
            {colourTemp ? ` · ${colourTemp}` : ""}
            {beam ? ` · ${beam}` : ""}
          </p>
        </button>
        <div
          data-testid="product-drag-handle"
          role="button"
          tabIndex={0}
          aria-label={`Drag ${product.name} to floor plan`}
          className="flex w-8 shrink-0 cursor-grab flex-col items-center justify-center rounded-md border border-dashed border-[var(--border)] bg-[var(--panel)] text-[var(--muted)] active:cursor-grabbing hover:border-[var(--accent)] hover:text-[var(--accent)]"
          onPointerDown={(event) => {
            if (event.button !== 0) {
              return;
            }
            event.preventDefault();
            event.stopPropagation();
            onSelect();
            beginProductDrag(
              product.id,
              roomId,
              event.pointerId,
              event.clientX,
              event.clientY,
            );
            try {
              event.currentTarget.setPointerCapture(event.pointerId);
            } catch {
              /* unsupported in some test environments */
            }
          }}
        >
          <span className="text-lg leading-none" aria-hidden>
            ⠿
          </span>
        </div>
      </div>
    </div>
  );
}
