# Mirrors @lightsale/shared Zod schemas — keep field names in sync with packages/shared/src/schemas.ts

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from app.document_normalize import default_output_settings, normalize_project_document

VALID_ROOM_TYPES = frozenset(
    {
        "living_room",
        "kitchen",
        "dining_room",
        "bedroom",
        "bathroom",
        "hallway",
        "home_office",
        "open_office",
        "private_office",
        "meeting_room",
        "reception",
        "corridor",
        "storage",
        "toilet",
        "technical_room",
        "other",
    }
)

VALID_STYLE_PRESETS = frozenset(
    {
        "functional",
        "warm_modern",
        "minimal",
        "hotel_chic",
        "industrial",
        "architectural",
        "custom",
    }
)

LEGACY_ROOM_TYPE_MAP = {
    "warehouse": "storage",
    "office": "open_office",
    "production": "technical_room",
    "corridor": "corridor",
}

LEGACY_STYLE_PRESET_MAP = {
    "standard": "functional",
    "high-bay": "industrial",
    "ambient": "warm_modern",
    "task-focused": "functional",
    "custom": "custom",
}

RoomType = Literal[
    "living_room",
    "kitchen",
    "dining_room",
    "bedroom",
    "bathroom",
    "hallway",
    "home_office",
    "open_office",
    "private_office",
    "meeting_room",
    "reception",
    "corridor",
    "storage",
    "toilet",
    "technical_room",
    "other",
]
CeilingType = Literal["suspended", "exposed", "grid", "sloped", "other"]
StylePreset = Literal[
    "functional",
    "warm_modern",
    "minimal",
    "hotel_chic",
    "industrial",
    "architectural",
    "custom",
]


class PointModel(BaseModel):
    x: float
    y: float


class ScaleCalibrationModel(BaseModel):
    pointA: PointModel
    pointB: PointModel
    realDistanceMetres: float = Field(gt=0)


class RoomModel(BaseModel):
    id: UUID
    name: str = Field(min_length=1)
    vertices: list[PointModel] = Field(min_length=3)
    roomType: RoomType = "other"
    ceilingHeightMetres: float = Field(default=3.0, gt=0)
    ceilingType: CeilingType = "exposed"
    targetLux: float | None = None
    stylePreset: StylePreset = "functional"
    selectedProductId: str | None = None
    utilisationFactor: float = Field(default=0.6, gt=0, le=1)
    maintenanceFactor: float = Field(default=0.8, gt=0, le=1)

    @model_validator(mode="before")
    @classmethod
    def migrate_legacy_fields(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        next_data = dict(data)
        room_type = next_data.get("roomType")
        if isinstance(room_type, str) and room_type not in VALID_ROOM_TYPES:
            next_data["roomType"] = LEGACY_ROOM_TYPE_MAP.get(room_type, "other")
        style = next_data.get("stylePreset")
        if isinstance(style, str) and style not in VALID_STYLE_PRESETS:
            next_data["stylePreset"] = LEGACY_STYLE_PRESET_MAP.get(
                style, "functional"
            )
        if not isinstance(next_data.get("utilisationFactor"), (int, float)):
            next_data["utilisationFactor"] = 0.6
        if not isinstance(next_data.get("maintenanceFactor"), (int, float)):
            next_data["maintenanceFactor"] = 0.8
        product_id = next_data.get("selectedProductId")
        if product_id is not None and not isinstance(product_id, str):
            next_data["selectedProductId"] = None
        return next_data

    @field_validator("targetLux")
    @classmethod
    def validate_target_lux(cls, value: float | None) -> float | None:
        if value is not None and value <= 0:
            raise ValueError("targetLux must be positive when set")
        return value


class ViewportStateModel(BaseModel):
    zoom: float = Field(gt=0)
    offsetX: float
    offsetY: float


PlacementSource = Literal["generated", "manual"]


class LuminaireModel(BaseModel):
    id: UUID
    roomId: UUID
    productId: str = Field(min_length=1)
    x: float
    y: float
    rotationDegrees: float
    placementSource: PlacementSource
    createdAt: datetime


class FloorPlanAssetModel(BaseModel):
    id: UUID
    fileName: str
    mimeType: str
    widthPx: float = Field(gt=0)
    heightPx: float = Field(gt=0)
    storagePath: str


class OutputSettingsModel(BaseModel):
    projectName: str = Field(default="", max_length=200)
    customerName: str = Field(default="", max_length=200)
    projectReference: str = Field(default="", max_length=200)
    projectAddress: str = Field(default="", max_length=500)
    designerName: str = Field(default="", max_length=200)
    outputDate: str = Field(default="", max_length=50)
    notes: str = Field(default="", max_length=2000)
    showFloorPlanBackground: bool = True
    showRoomOutlines: bool = True
    showRoomNames: bool = True
    showLuminaireSymbols: bool = True
    showLuminaireNumbers: bool = False
    showScale: bool = True
    showLegend: bool = True
    showLightIndicator: bool = False
    includeLightIndicatorInPdf: bool = False
    showLuxSummary: bool = True
    showComplianceStatus: bool = True


class ProjectDocumentModel(BaseModel):
    scale: ScaleCalibrationModel | None = None
    rooms: list[RoomModel] = Field(default_factory=list)
    luminaires: list[LuminaireModel] = Field(default_factory=list)
    outputSettings: OutputSettingsModel = Field(
        default_factory=OutputSettingsModel
    )
    viewport: ViewportStateModel | None = None

    @model_validator(mode="before")
    @classmethod
    def normalize_document(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return normalize_project_document(data)
        return data


class ProjectModel(BaseModel):
    id: UUID
    name: str
    createdAt: datetime
    updatedAt: datetime
    floorPlan: FloorPlanAssetModel | None
    document: ProjectDocumentModel


class CreateProjectRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class UpdateProjectDocumentRequest(BaseModel):
    scale: ScaleCalibrationModel | None = None
    rooms: list[RoomModel] = Field(default_factory=list)
    luminaires: list[LuminaireModel] = Field(default_factory=list)
    outputSettings: OutputSettingsModel = Field(
        default_factory=OutputSettingsModel
    )
    viewport: ViewportStateModel | None = None

    @model_validator(mode="before")
    @classmethod
    def normalize_document(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return normalize_project_document(data)
        return data


class ProjectListItem(BaseModel):
    id: UUID
    name: str
    createdAt: datetime
    updatedAt: datetime
    hasFloorPlan: bool
    customerName: str = ""
    roomCount: int = 0
    luminaireCount: int = 0


class RenameProjectRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class ProjectTrashStats(BaseModel):
    activeProjectCount: int
    trashProjectCount: int
    totalUploadedBytes: int | None = None


def default_document() -> dict[str, Any]:
    return {
        "scale": None,
        "rooms": [],
        "luminaires": [],
        "outputSettings": default_output_settings(),
        "viewport": {"zoom": 1, "offsetX": 0, "offsetY": 0},
    }
