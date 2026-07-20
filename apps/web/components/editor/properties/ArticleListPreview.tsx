"use client";

import {
  buildArticleList,
  formatPositionNumbers,
  type ArticleListResult,
} from "@lightsale/shared";
import { useEditorStore } from "@/lib/editor/store";
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
      <div className="overflow-x-auto rounded border border-[var(--border)]">
        <table className="w-full min-w-[520px] text-left text-[11px]">
          <thead className="border-b border-[var(--border)] bg-[var(--background)] text-[var(--muted)]">
            <tr>
              <th className="px-2 py-1.5 font-medium">Pos.</th>
              <th className="px-2 py-1.5 font-medium">Article</th>
              <th className="px-2 py-1.5 font-medium">Brand</th>
              <th className="px-2 py-1.5 font-medium">Product</th>
              <th className="px-2 py-1.5 font-medium text-right">Qty</th>
              <th className="px-2 py-1.5 font-medium text-right">lm/ea</th>
              <th className="px-2 py-1.5 font-medium text-right">W/ea</th>
              <th className="px-2 py-1.5 font-medium text-right">Total W</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row) => (
              <tr
                key={row.productId}
                className="border-b border-[var(--border)]/60"
              >
                <td className="px-2 py-1.5 text-white">
                  {formatPositionNumbers(row.positionNumbers)}
                </td>
                <td className="px-2 py-1.5 text-white">{row.articleNumber}</td>
                <td className="px-2 py-1.5 text-white">{row.brand}</td>
                <td className="px-2 py-1.5 text-white">{row.productName}</td>
                <td className="px-2 py-1.5 text-right text-white">
                  {row.quantity}
                </td>
                <td className="px-2 py-1.5 text-right text-white">
                  {row.luminousFluxPerLuminaire.toLocaleString("en-GB")}
                </td>
                <td className="px-2 py-1.5 text-right text-white">
                  {row.powerPerLuminaire}
                </td>
                <td className="px-2 py-1.5 text-right text-white">
                  {Math.round(row.totalWattage)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  return <h4 className={subsectionTitleClassName}>Article list preview</h4>;
}
