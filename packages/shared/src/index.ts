export {
  PointSchema,
  ScaleCalibrationSchema,
  RoomSchema,
  RoomTypeSchema,
  CeilingTypeSchema,
  StylePresetSchema,
  ViewportStateSchema,
  FloorPlanAssetSchema,
  ProjectDocumentSchema,
  ProjectSchema,
  CreateProjectInputSchema,
  UpdateProjectDocumentInputSchema,
  DEFAULT_VIEWPORT,
  EMPTY_PROJECT_DOCUMENT,
  DEFAULT_ROOM_PROPERTY_VALUES,
  ROOM_TYPES,
  CEILING_TYPES,
  STYLE_PRESETS,
  normalizeRoom,
  defaultRoomPropertyFields,
} from "./schemas.js";

export type {
  Point,
  ScaleCalibration,
  Room,
  RoomType,
  CeilingType,
  StylePreset,
  RoomPropertyPatch,
  ViewportState,
  FloorPlanAsset,
  ProjectDocument,
  Project,
  CreateProjectInput,
  UpdateProjectDocumentInput,
} from "./schemas.js";

export {
  pixelDistance,
  metresPerPixel,
  pixelsToMetres,
  pointToMetres,
} from "./scale.js";

export {
  polygonAreaPixels,
  polygonAreaSquareMetres,
  formatAreaSquareMetres,
} from "./area.js";

export {
  canvasToScreen,
  screenToCanvas,
  zoomAtPoint,
  panViewport,
} from "./viewport.js";

export {
  DEFAULT_TARGET_LUX_BY_ROOM_TYPE,
  defaultTargetLuxForRoomType,
  getEffectiveTargetLux,
  isTargetLuxUnset,
  calculateRequiredLumens,
  formatRequiredLumens,
  targetLuxAfterRoomTypeChange,
} from "./room-lighting.js";

export {
  PRODUCT_CATEGORIES,
  MOUNTING_TYPES,
  LightingProductSchema,
  DEMO_LIGHTING_PRODUCTS,
  DEMO_PRODUCT_IDS,
  getProductById,
  getAllProducts,
} from "./product-catalog.js";

export type {
  ProductCategory,
  MountingType,
  LightingProduct,
} from "./product-catalog.js";

export {
  isProductCompatibleWithRoom,
  filterCompatibleProducts,
  calculateEffectiveLumensPerLuminaire,
  calculateIndicativeLuminaireQuantity,
  calculateTotalInstalledWatts,
  calculateIndicativeLuminaireEstimate,
  selectedProductIdAfterRoomContextChange,
} from "./luminaire-quantity.js";

export type {
  IndicativeLuminaireEstimate,
  IndicativeLuminaireEstimateInput,
} from "./luminaire-quantity.js";

export { migrateLegacyRoomFields } from "./room-migration.js";
