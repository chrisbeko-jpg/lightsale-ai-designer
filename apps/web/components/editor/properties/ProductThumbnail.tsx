"use client";

import type { LightingProduct } from "@lightsale/shared";
import {
  getProductDisplayColor,
  productCategoryLabel,
  resolveProductThumbnailUrl,
} from "@lightsale/shared";

interface ProductThumbnailProps {
  product: Pick<
    LightingProduct,
    "id" | "imageUrl" | "category" | "brand" | "name"
  >;
  size?: number;
  showColorRing?: boolean;
  className?: string;
}

export function ProductThumbnail({
  product,
  size = 64,
  showColorRing = true,
  className = "",
}: ProductThumbnailProps) {
  const src = resolveProductThumbnailUrl(product);
  const color = getProductDisplayColor(product.id);

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-md border bg-[#0f172a] ${className}`}
      style={{
        width: size,
        height: size,
        borderColor: showColorRing ? color : "var(--border)",
        borderWidth: showColorRing ? 2 : 1,
      }}
      title={productCategoryLabel(product.category)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className="h-full w-full object-contain p-1"
      />
    </div>
  );
}

interface ProductColorDotProps {
  productId: string;
  className?: string;
}

export function ProductColorDot({ productId, className = "" }: ProductColorDotProps) {
  const color = getProductDisplayColor(productId);
  return (
    <span
      className={`inline-block h-3 w-3 shrink-0 rounded-full ${className}`}
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}
