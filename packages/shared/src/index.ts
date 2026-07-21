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
  getCatalogProducts,
  isLegacyProduct,
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

export {
  isPointInPolygon,
  polygonAxisAlignedBounds,
} from "./point-in-polygon.js";
export type { AxisAlignedBounds } from "./point-in-polygon.js";

export {
  GRID_PLACEMENT_CATEGORIES,
  DEFAULT_LAYOUT_WALL_MARGIN_METRES,
  chooseGridDimensions,
  generateSymmetricGridPoints,
  selectGridPointsForQuantity,
  generateGridPlacementPoints,
  countLuminairesForRoom,
  compareRoomLuminaireQuantities,
} from "./grid-placement.js";
export type {
  GridDimensions,
  GenerateGridPlacementInput,
  GenerateGridPlacementResult,
} from "./grid-placement.js";

export {
  generateCategoryPlacementPoints,
  generateWallLuminairePlacementPoints,
  buildLayoutProposalPreviewText,
  buildLayoutGenerationResultText,
  isManualPlacementOnlyCategory,
  supportsAutomaticGridPlacement,
  MANUAL_ONLY_PLACEMENT_CATEGORIES,
} from "./category-placement.js";
export type { PlacementPoint } from "./category-placement.js";

export {
  computeContainTransform,
  planPointToViewport,
  aspectRatiosMatch,
  renderedPlanSize,
  resolvePlanSourceDimensions,
  normalizePointToPlanOrigin,
  contentBoundsFromGeometry,
} from "./plan-viewport.js";
export type { PlanViewportTransform, PlanSourceDimensions } from "./plan-viewport.js";

export {
  calculateFloorplanPdfTransform,
} from "./pdf-floorplan-transform.js";
export type {
  FloorplanPdfTransform,
  FloorplanPdfTransformInput,
} from "./pdf-floorplan-transform.js";

export {
  INDICATIVE_LUX_DISCLAIMER_NL,
  INDICATIVE_LUX_PDF_DISCLAIMER_NL,
  calculateEffectiveLumens,
  luminairesInsideRoom,
  calculateRoomActualEffectiveLumens,
  calculateIndicativeAverageLux,
  calculateLuxCompliance,
  calculateProjectLightingSummary,
  countLuminairesOutsideAllRooms,
} from "./indicative-lux.js";
export type {
  LuxComplianceResult,
  LuxComplianceBand,
  RoomLightingPerformance,
  ProjectLightingSummary,
} from "./indicative-lux.js";

export {
  resolveBeamAngleDegrees,
  calculateIndicativeInfluenceRadiusMetres,
  calculateIndicativeInfluenceRadiusPx,
  relativeIntensityAtDistance,
  buildHeatmapDataForRoom,
  buildProjectHeatmapData,
  sampleHeatmapIntensityAtPoint,
} from "./heatmap-model.js";
export type {
  HeatmapLuminaireContribution,
  RoomHeatmapData,
} from "./heatmap-model.js";

export {
  validateLayoutGeneration,
  validateManualLuminairePlacement,
} from "./layout-validation.js";
export type {
  LayoutGenerationValidation,
  LayoutGenerationValidationInput,
} from "./layout-validation.js";

export {
  createLuminairesFromGridPoints,
  generateLuminairesForRoom,
  validateLuminairePlacementAtPoint,
  findRoomContainingPoint,
  isPointWithinFloorPlanBounds,
  createLuminaireAtPoint,
} from "./luminaire-placement.js";
export type {
  FloorPlanBounds,
  LuminairePlacementValidationInput,
} from "./luminaire-placement.js";

export {
  countLuminairesOutsideRoom,
  defaultManualLuminairePosition,
  isLuminaireInsideRoom,
  isRoomGeometryValid,
  roomPolygonCentroid,
} from "./luminaire-room.js";

export { normalizeLoadedProjectDocument } from "./document-normalization.js";

export {
  OutputSettingsSchema,
  DEFAULT_OUTPUT_SETTINGS,
  normalizeOutputSettings,
  NormalizedOutputSettingsSchema,
} from "./output-settings.js";
export type { OutputSettings, OutputSettingsPatch } from "./output-settings.js";

export {
  assignLuminairePositionNumbers,
  buildArticleList,
  formatPositionNumbers,
} from "./article-list.js";
export type {
  ArticleListRow,
  ArticleListResult,
  LuminairePositionLabel,
} from "./article-list.js";

export {
  LuminaireSchema,
  PlacementSourceSchema,
  PLACEMENT_SOURCES,
  normalizeLuminaire,
  normalizeLuminaires,
} from "./schemas.js";

export type { Luminaire, PlacementSource } from "./schemas.js";

export {
  PRODUCT_DISPLAY_COLOR_PALETTE,
  getProductDisplayColor,
  buildProductColorMap,
  withAlpha,
} from "./product-colors.js";

export { buildProductLegend } from "./product-legend.js";
export type { ProductLegendEntry } from "./product-legend.js";

export {
  PRODUCT_CATEGORY_LABELS,
  productCategoryLabel,
  defaultProductThumbnailPath,
  resolveProductThumbnailUrl,
  formatColourTemperature,
  formatBeamAngle,
} from "./product-display.js";

export {
  buildLightingPlanPdfFilename,
  sanitizePdfProjectSlug,
  extractPdfProjectMetadata,
  PDF_DISCLAIMER,
} from "./pdf-export-meta.js";
export type { PdfProjectMetadata } from "./pdf-export-meta.js";

export {
  ProductDimensionsSchema,
  calculateLuminairePlanFootprintPx,
  millimetresToPlanPixels,
  hitRadiusPlanPx,
  formatProductDimensionsLabel,
  MIN_LUMINAIRE_HIT_RADIUS_SCREEN_PX,
} from "./product-dimensions.js";
export type { LuminairePlanFootprintPx, ProductDimensions } from "./product-dimensions.js";

export { drawLuminaireSymbolOnCanvas } from "./luminaire-symbol-draw.js";

export {
  PNG_DATA_URL_PREFIX,
  detectImageMimeTypeFromDataUrl,
  validatePngDataUrl,
  detectImageMimeTypeFromBytes,
} from "./pdf-image-prep.js";

export { WL_LIGHTING_PRODUCTS, WL_PRODUCT_IDS } from "./wl-products.js";
