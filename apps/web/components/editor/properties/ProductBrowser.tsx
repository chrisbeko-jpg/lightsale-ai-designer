"use client";

import { useMemo, useState } from "react";
import type { ProductCategory, Room, RoomPropertyPatch } from "@lightsale/shared";
import {
  PRODUCT_CATEGORIES,
  filterCompatibleProducts,
  getAllProducts,
  productCategoryLabel,
} from "@lightsale/shared";
import { fieldClassName, labelClassName } from "./editor-form-styles";
import { ProductCard } from "./ProductCard";

interface ProductBrowserProps {
  room: Room;
  onPatch: (patch: RoomPropertyPatch) => void;
}

export function ProductBrowser({ room, onPatch }: ProductBrowserProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "all">(
    "all",
  );

  const products = useMemo(() => {
    const compatible = filterCompatibleProducts(getAllProducts(), room);
    const normalizedQuery = query.trim().toLowerCase();
    return compatible.filter((product) => {
      if (categoryFilter !== "all" && product.category !== categoryFilter) {
        return false;
      }
      if (normalizedQuery === "") {
        return true;
      }
      const haystack = [
        product.brand,
        product.name,
        product.articleNumber ?? "",
        productCategoryLabel(product.category),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [room, query, categoryFilter]);

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--muted)]">
        Browse compatible luminaires. Each product has a unique colour on the
        floor plan.
      </p>
      <label className={labelClassName}>
        Search products
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Brand, name, article…"
          className={fieldClassName}
        />
      </label>
      <label className={labelClassName}>
        Category
        <select
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(event.target.value as ProductCategory | "all")
          }
          className={fieldClassName}
        >
          <option value="all">All categories</option>
          {PRODUCT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {productCategoryLabel(category)}
            </option>
          ))}
        </select>
      </label>
      {products.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">
          No products match your filters for this room.
        </p>
      ) : (
        <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard
                product={product}
                selected={room.selectedProductId === product.id}
                onSelect={() => onPatch({ selectedProductId: product.id })}
              />
            </li>
          ))}
        </ul>
      )}

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
