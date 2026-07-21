import { z } from "zod";
import { ProductDimensionsSchema } from "./product-dimensions.js";
import { WL_LIGHTING_PRODUCTS } from "./wl-products.js";

export const PRODUCT_CATEGORIES = [
  "downlight",
  "tracklighting",
  "recessed_spot",
  "led_panel",
  "surface_spot",
  "track_spot",
  "pendant",
  "panel",
  "linear",
] as const;

export const ProductCategorySchema = z.enum(PRODUCT_CATEGORIES);
export type ProductCategory = z.infer<typeof ProductCategorySchema>;

export const MOUNTING_TYPES = [
  "recessed",
  "surface",
  "track",
  "pendant",
  "panel",
  "linear",
  "recessed_grid",
] as const;

export const MountingTypeSchema = z.enum(MOUNTING_TYPES);
export type MountingType = z.infer<typeof MountingTypeSchema>;

export const LightingProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  category: ProductCategorySchema,
  luminousFluxLumens: z.number().positive(),
  powerWatts: z.number().positive(),
  mountingTypes: z.array(MountingTypeSchema).min(1),
  suitableRoomTypes: z.array(z.string().min(1)).min(1),
  suitableStylePresets: z.array(z.string().min(1)).min(1),
  imageUrl: z.string().min(1).optional(),
  articleNumber: z.string().min(1).optional(),
  categoryIcon: z.string().min(1).optional(),
  colourTemperatureKelvin: z.number().positive().optional(),
  beamAngleDegrees: z.number().positive().optional(),
  dimensions: ProductDimensionsSchema.optional(),
  legacy: z.boolean().optional(),
  dimmingType: z.string().optional(),
  cri: z.string().optional(),
  adjustable: z.boolean().optional(),
});

export type LightingProduct = z.infer<typeof LightingProductSchema>;

const LEGACY_LIGHTING_PRODUCTS: LightingProduct[] = [
  {
    id: "demo-downlight-evo-12w",
    name: "Evo LED Downlight 12W",
    brand: "Lightsale Demo",
    category: "downlight",
    legacy: true,
    luminousFluxLumens: 1100,
    powerWatts: 12,
    mountingTypes: ["recessed"],
    suitableRoomTypes: [
      "living_room",
      "kitchen",
      "hallway",
      "home_office",
      "private_office",
      "reception",
      "corridor",
    ],
    suitableStylePresets: ["functional", "minimal", "warm_modern"],
    articleNumber: "LS-DL-012",
    colourTemperatureKelvin: 4000,
    beamAngleDegrees: 90,
  },
  {
    id: "demo-surface-spot-18w",
    name: "Surface Spot Pro 18W",
    brand: "Lightsale Demo",
    category: "surface_spot",
    legacy: true,
    luminousFluxLumens: 1600,
    powerWatts: 18,
    mountingTypes: ["surface"],
    suitableRoomTypes: [
      "kitchen",
      "dining_room",
      "storage",
      "technical_room",
      "other",
    ],
    suitableStylePresets: ["industrial", "functional", "architectural"],
    articleNumber: "LS-SS-018",
  },
  {
    id: "demo-track-spot-25w",
    name: "Track Spot Accent 25W",
    brand: "Lightsale Demo",
    category: "track_spot",
    luminousFluxLumens: 2200,
    powerWatts: 25,
    mountingTypes: ["track"],
    suitableRoomTypes: [
      "living_room",
      "dining_room",
      "reception",
      "meeting_room",
      "open_office",
    ],
    suitableStylePresets: ["warm_modern", "hotel_chic", "architectural", "custom"],
    articleNumber: "LS-TS-025",
  },
  {
    id: "demo-pendant-soft-40w",
    name: "Soft Pendant 40W",
    brand: "Lightsale Demo",
    category: "pendant",
    luminousFluxLumens: 3200,
    powerWatts: 40,
    mountingTypes: ["pendant"],
    suitableRoomTypes: [
      "living_room",
      "dining_room",
      "bedroom",
      "meeting_room",
      "reception",
    ],
    suitableStylePresets: ["warm_modern", "minimal", "hotel_chic"],
    articleNumber: "LS-PD-040",
  },
  {
    id: "demo-panel-office-36w",
    name: "Office Panel 60×60 36W",
    brand: "Lightsale Demo",
    category: "panel",
    luminousFluxLumens: 3600,
    powerWatts: 36,
    mountingTypes: ["panel", "recessed"],
    suitableRoomTypes: [
      "open_office",
      "private_office",
      "home_office",
      "meeting_room",
      "corridor",
    ],
    suitableStylePresets: ["functional", "minimal"],
    articleNumber: "LS-PN-036",
  },
  {
    id: "demo-linear-connect-48w",
    name: "Connect Linear 48W",
    brand: "Lightsale Demo",
    category: "linear",
    luminousFluxLumens: 4800,
    powerWatts: 48,
    mountingTypes: ["linear", "surface"],
    suitableRoomTypes: [
      "open_office",
      "corridor",
      "kitchen",
      "storage",
      "technical_room",
    ],
    suitableStylePresets: ["functional", "industrial", "architectural"],
    articleNumber: "LS-LN-048",
  },
  {
    id: "demo-downlight-wet-15w",
    name: "Wet Zone Downlight 15W",
    brand: "Lightsale Demo",
    category: "downlight",
    luminousFluxLumens: 1200,
    powerWatts: 15,
    mountingTypes: ["recessed"],
    suitableRoomTypes: ["bathroom", "toilet", "kitchen"],
    suitableStylePresets: ["functional", "minimal"],
    articleNumber: "LS-DL-015-IP",
  },
  {
    id: "demo-panel-hotel-28w",
    name: "Hotel Panel Round 28W",
    brand: "Lightsale Demo",
    category: "panel",
    luminousFluxLumens: 2800,
    powerWatts: 28,
    mountingTypes: ["panel", "surface"],
    suitableRoomTypes: ["bedroom", "hallway", "reception", "living_room"],
    suitableStylePresets: ["hotel_chic", "warm_modern", "minimal"],
    articleNumber: "LS-PN-028-R",
  },
  {
    id: "demo-track-gallery-35w",
    name: "Gallery Track 35W",
    brand: "Lightsale Demo",
    category: "track_spot",
    luminousFluxLumens: 3000,
    powerWatts: 35,
    mountingTypes: ["track"],
    suitableRoomTypes: ["reception", "living_room", "meeting_room", "open_office"],
    suitableStylePresets: ["architectural", "custom", "industrial"],
    articleNumber: "LS-TS-035",
  },
  {
    id: "demo-linear-ambient-24w",
    name: "Ambient Linear 24W",
    brand: "Lightsale Demo",
    category: "linear",
    luminousFluxLumens: 2400,
    powerWatts: 24,
    mountingTypes: ["linear"],
    suitableRoomTypes: [
      "bedroom",
      "living_room",
      "hallway",
      "home_office",
      "dining_room",
    ],
    suitableStylePresets: ["warm_modern", "minimal", "custom"],
    articleNumber: "LS-LN-024",
  },
];

/** Validated WL sample catalogue (default when no external product DB is configured). */
export const WL_CATALOG_PRODUCTS: LightingProduct[] = WL_LIGHTING_PRODUCTS.map(
  (product) => LightingProductSchema.parse(product),
);

export const ALL_LIGHTING_PRODUCTS: LightingProduct[] = [
  ...WL_CATALOG_PRODUCTS,
  ...LEGACY_LIGHTING_PRODUCTS.map((product) => ({ ...product, legacy: true })),
];

/** Includes WL catalogue and legacy demo products for lookup. */
export const DEMO_LIGHTING_PRODUCTS = ALL_LIGHTING_PRODUCTS;

export const DEMO_PRODUCT_IDS = new Set(
  ALL_LIGHTING_PRODUCTS.map((product) => product.id),
);

export function getProductById(productId: string): LightingProduct | undefined {
  return ALL_LIGHTING_PRODUCTS.find((product) => product.id === productId);
}

export function getAllProducts(): readonly LightingProduct[] {
  return ALL_LIGHTING_PRODUCTS;
}

export function getCatalogProducts(): readonly LightingProduct[] {
  return WL_CATALOG_PRODUCTS;
}

export function isLegacyProduct(productId: string): boolean {
  const product = getProductById(productId);
  return product?.legacy === true;
}
