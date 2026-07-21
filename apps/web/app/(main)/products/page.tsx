import { getCatalogProducts, productCategoryLabel } from "@lightsale/shared";
import { ProductThumbnail } from "@/components/editor/properties/ProductThumbnail";

export default function ProductsPage() {
  const products = getCatalogProducts();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-white">Producten</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          WL-voorbeeldcatalogus en productgegevens voor lichtontwerp.
        </p>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2">
        {products.map((product) => (
          <li
            key={product.id}
            className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3"
          >
            <ProductThumbnail product={product} size={72} />
            <div className="min-w-0 text-sm">
              <p className="text-[10px] uppercase text-[var(--muted)]">{product.brand}</p>
              <p className="font-medium text-white">{product.name}</p>
              <p className="text-xs text-zinc-400">
                {productCategoryLabel(product.category)} · {product.luminousFluxLumens} lm ·{" "}
                {product.powerWatts} W
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
