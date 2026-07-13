export {
  PointSchema,
  ScaleCalibrationSchema,
  RoomSchema,
  ViewportStateSchema,
  FloorPlanAssetSchema,
  ProjectDocumentSchema,
  ProjectSchema,
  CreateProjectInputSchema,
  UpdateProjectDocumentInputSchema,
  DEFAULT_VIEWPORT,
  EMPTY_PROJECT_DOCUMENT,
} from "./schemas.js";

export type {
  Point,
  ScaleCalibration,
  Room,
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
