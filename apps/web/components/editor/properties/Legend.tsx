"use client";

import { buildProductLegend } from "@lightsale/shared";
import { ProductColorDot } from "./ProductThumbnail";

interface LegendProps {
  productIds: readonly string[];
  compact?: boolean;
}

export function Legend({ productIds, compact = false }: LegendProps) {
  const entries = buildProductLegend(productIds);

  if (entries.length === 0) {
    return (
      <p className="text-xs text-[var(--muted)]">
        Place luminaires to generate a product legend.
      </p>
    );
  }

  return (
    <ul className={compact ? "space-y-1" : "space-y-2"}>
      {entries.map((entry) => (
        <li
          key={entry.productId}
          className="flex items-start gap-2 text-xs text-white"
        >
          <ProductColorDot productId={entry.productId} className="mt-0.5" />
          <span className="min-w-0">
            <span className="font-medium">{entry.brand}</span>{" "}
            {entry.articleNumber || entry.productName}
          </span>
        </li>
      ))}
    </ul>
  );
}
