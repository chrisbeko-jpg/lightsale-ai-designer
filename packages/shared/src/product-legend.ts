import { getProductById } from "./product-catalog.js";
import { getProductDisplayColor } from "./product-colors.js";

export interface ProductLegendEntry {
  productId: string;
  color: string;
  brand: string;
  productName: string;
  articleNumber: string;
  label: string;
}

export function buildProductLegend(
  productIds: readonly string[],
): ProductLegendEntry[] {
  const unique = [...new Set(productIds)].sort((a, b) => {
    const productA = getProductById(a);
    const productB = getProductById(b);
    const brand = (productA?.brand ?? a).localeCompare(productB?.brand ?? b);
    if (brand !== 0) {
      return brand;
    }
    return (productA?.name ?? a).localeCompare(productB?.name ?? b);
  });

  return unique.map((productId) => {
    const product = getProductById(productId);
    const brand = product?.brand ?? "Unknown";
    const productName = product?.name ?? productId;
    const articleNumber = product?.articleNumber ?? "";
    const label = articleNumber
      ? `${brand} ${articleNumber}`
      : `${brand} ${productName}`;
    return {
      productId,
      color: getProductDisplayColor(productId),
      brand,
      productName,
      articleNumber,
      label,
    };
  });
}
