"use client";

import { useState } from "react";
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

function SymbolFallback({
  product,
  size,
}: {
  product: ProductThumbnailProps["product"];
  size: number;
}) {
  const color = getProductDisplayColor(product.id);
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-0.5 p-1 text-center"
      title={productCategoryLabel(product.category)}
    >
      <span
        className="rounded-full"
        style={{
          width: size * 0.35,
          height: size * 0.35,
          backgroundColor: color,
        }}
      />
      <span className="text-[8px] leading-tight text-[var(--muted)]">
        {product.brand}
      </span>
    </div>
  );
}

export function ProductThumbnail({
  product,
  size = 64,
  showColorRing = true,
  className = "",
}: ProductThumbnailProps) {
  const primarySrc = resolveProductThumbnailUrl(product);
  const [src, setSrc] = useState(primarySrc);
  const [failed, setFailed] = useState(false);
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
      {failed ? (
        <SymbolFallback product={product} size={size} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-contain p-1"
          draggable={false}
          onError={() => {
            if (src !== primarySrc) {
              setFailed(true);
              return;
            }
            setSrc(
              `/product-thumbnails/${product.category === "tracklighting" ? "track_spot" : product.category === "led_panel" ? "panel" : "downlight"}.svg`,
            );
          }}
        />
      )}
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
