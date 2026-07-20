"use client";

import type { Room, RoomPropertyPatch } from "@lightsale/shared";
import {
  filterCompatibleProducts,
  getAllProducts,
  getProductById,
} from "@lightsale/shared";
import { fieldClassName, labelClassName } from "./editor-form-styles";

const CATEGORY_LABELS: Record<string, string> = {
  downlight: "Downlight",
  surface_spot: "Surface spot",
  track_spot: "Track spot",
  pendant: "Pendant",
  panel: "Panel",
  linear: "Linear",
};

interface ProductSelectorProps {
  room: Room;
  onPatch: (patch: RoomPropertyPatch) => void;
  prominent?: boolean;
}

export function ProductSelector({
  room,
  onPatch,
  prominent = false,
}: ProductSelectorProps) {
  const compatibleProducts = filterCompatibleProducts(getAllProducts(), room);
  const selectedProduct =
    room.selectedProductId !== null
      ? getProductById(room.selectedProductId)
      : undefined;

  return (
    <div
      className={
        prominent
          ? "space-y-2 rounded border border-[var(--accent)]/40 bg-[var(--background)] p-3"
          : "space-y-2"
      }
    >
      {prominent ? (
        <p className="text-xs text-[var(--foreground)]">
          Select a luminaire product to configure lighting for this room.
        </p>
      ) : null}

      <label className={labelClassName}>
        Luminaire product
        <select
          value={room.selectedProductId ?? ""}
          onChange={(event) => {
            const value = event.target.value;
            onPatch({ selectedProductId: value === "" ? null : value });
          }}
          className={fieldClassName}
        >
          <option value="">No product selected</option>
          {compatibleProducts.map((product) => (
            <option key={product.id} value={product.id}>
              {product.brand} — {product.name}
            </option>
          ))}
        </select>
        {compatibleProducts.length === 0 ? (
          <span className="mt-1 block text-[11px] text-[var(--muted)]">
            No compatible products for this room type and style.
          </span>
        ) : null}
      </label>

      {selectedProduct ? (
        <div className="space-y-2 text-xs">
          {selectedProduct.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedProduct.imageUrl}
              alt=""
              className="max-h-24 w-full rounded border border-[var(--border)] object-contain bg-white/5"
            />
          ) : null}
          <dl className="grid grid-cols-2 gap-x-2 gap-y-1">
            <dt className="text-[var(--muted)]">Brand</dt>
            <dd className="text-right text-white">{selectedProduct.brand}</dd>
            <dt className="text-[var(--muted)]">Article</dt>
            <dd className="text-right text-white">
              {selectedProduct.articleNumber ?? "—"}
            </dd>
            <dt className="text-[var(--muted)]">Category</dt>
            <dd className="text-right text-white">
              {CATEGORY_LABELS[selectedProduct.category] ??
                selectedProduct.category}
            </dd>
            <dt className="text-[var(--muted)]">Luminous flux</dt>
            <dd className="text-right text-white">
              {selectedProduct.luminousFluxLumens.toLocaleString("en-GB")} lm
            </dd>
            <dt className="text-[var(--muted)]">Power</dt>
            <dd className="text-right text-white">
              {selectedProduct.powerWatts} W
            </dd>
          </dl>
        </div>
      ) : null}

      <label className={labelClassName}>
        Utilisation factor
        <input
          type="number"
          min="0.01"
          max="1"
          step="0.01"
          value={room.utilisationFactor}
          onChange={(event) => {
            const factor = parseFloat(event.target.value);
            if (Number.isFinite(factor) && factor > 0 && factor <= 1) {
              onPatch({ utilisationFactor: factor });
            }
          }}
          className={fieldClassName}
        />
      </label>

      <label className={labelClassName}>
        Maintenance factor
        <input
          type="number"
          min="0.01"
          max="1"
          step="0.01"
          value={room.maintenanceFactor}
          onChange={(event) => {
            const factor = parseFloat(event.target.value);
            if (Number.isFinite(factor) && factor > 0 && factor <= 1) {
              onPatch({ maintenanceFactor: factor });
            }
          }}
          className={fieldClassName}
        />
      </label>
    </div>
  );
}
