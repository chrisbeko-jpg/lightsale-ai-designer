"use client";

import {
  buildArticleList,
  formatPositionNumbers,
  getProductById,
  type ArticleListResult,
} from "@lightsale/shared";
import { useEditorStore } from "@/lib/editor/store";
import { ProductColorDot, ProductThumbnail } from "./ProductThumbnail";
import { subsectionTitleClassName } from "./editor-form-styles";

export function useArticleListPreview(): ArticleListResult {
  const luminaires = useEditorStore((s) => s.luminaires);
  const rooms = useEditorStore((s) => s.rooms);
  return buildArticleList(luminaires, rooms);
}

export function ArticleListPreview() {
  const result = useArticleListPreview();

  if (result.rows.length === 0) {
    return (
      <p className="text-xs text-[var(--muted)]">
        No luminaires placed yet. Place luminaires on the floor plan to build
        the article list.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {result.rows.map((row) => {
          const product = getProductById(row.productId);
          return (
            <li
              key={row.productId}
              className="flex gap-2 rounded border border-[var(--border)] bg-[var(--background)] p-2"
            >
              <ProductColorDot productId={row.productId} className="mt-1" />
              {product ? (
                <ProductThumbnail product={product} size={48} showColorRing={false} />
              ) : (
                <div className="h-12 w-12 shrink-0 rounded bg-[var(--panel)]" />
              )}
              <div className="min-w-0 flex-1 text-[11px]">
                <p className="font-medium text-white">
                  {row.brand} — {row.productName}
                </p>
                <p className="text-[var(--muted)]">{row.articleNumber}</p>
                <p className="text-[var(--foreground)]">
                  Qty {row.quantity} · Pos. {formatPositionNumbers(row.positionNumbers)}
                </p>
                <p className="text-[var(--foreground)]">
                  {row.luminousFluxPerLuminaire.toLocaleString("en-GB")} lm ·{" "}
                  {row.powerPerLuminaire} W · Total{" "}
                  {Math.round(row.totalWattage)} W
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
        <dt className="text-[var(--muted)]">Total luminaires</dt>
        <dd className="text-right text-white">{result.totalLuminaires}</dd>
        <dt className="text-[var(--muted)]">Total installed wattage</dt>
        <dd className="text-right text-white">
          {Math.round(result.totalInstalledWattage)} W
        </dd>
        <dt className="text-[var(--muted)]">Unique products</dt>
        <dd className="text-right text-white">{result.uniqueProductCount}</dd>
        <dt className="text-[var(--muted)]">Rooms included</dt>
        <dd className="text-right text-white">{result.roomsIncludedCount}</dd>
      </dl>
    </div>
  );
}

export function ArticleListPreviewHeading() {
  return <h4 className={subsectionTitleClassName}>Article list</h4>;
}
