import type { LightingProduct, ProductCategory } from "./product-catalog.js";

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  downlight: "Downlight",
  surface_spot: "Surface mounted",
  track_spot: "Track spot",
  pendant: "Pendant",
  panel: "Panel",
  linear: "Linear profile",
};

export function productCategoryLabel(category: ProductCategory): string {
  return PRODUCT_CATEGORY_LABELS[category];
}

/** Default thumbnail when no product imageUrl is set. */
export function defaultProductThumbnailPath(category: ProductCategory): string {
  return `/product-thumbnails/${category}.svg`;
}

export function resolveProductThumbnailUrl(
  product: Pick<LightingProduct, "imageUrl" | "category">,
): string {
  return product.imageUrl ?? defaultProductThumbnailPath(product.category);
}

export function formatColourTemperature(kelvin: number | undefined): string | null {
  if (kelvin === undefined || !Number.isFinite(kelvin)) {
    return null;
  }
  return `${Math.round(kelvin)} K`;
}

export function formatBeamAngle(degrees: number | undefined): string | null {
  if (degrees === undefined || !Number.isFinite(degrees)) {
    return null;
  }
  return `${Math.round(degrees)}°`;
}
