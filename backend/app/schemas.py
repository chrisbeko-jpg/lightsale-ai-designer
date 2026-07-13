# Mirrors @lightsale/shared Zod schemas — keep field names in sync with packages/shared/src/schemas.ts

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


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


class ViewportStateModel(BaseModel):
    zoom: float = Field(gt=0)
    offsetX: float
    offsetY: float


class FloorPlanAssetModel(BaseModel):
    id: UUID
    fileName: str
    mimeType: str
    widthPx: float = Field(gt=0)
    heightPx: float = Field(gt=0)
    storagePath: str


class ProjectDocumentModel(BaseModel):
    scale: ScaleCalibrationModel | None = None
    rooms: list[RoomModel] = Field(default_factory=list)
    viewport: ViewportStateModel | None = None


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
    viewport: ViewportStateModel | None = None


class ProjectListItem(BaseModel):
    id: UUID
    name: str
    createdAt: datetime
    updatedAt: datetime
    hasFloorPlan: bool


def default_document() -> dict[str, Any]:
    return {
        "scale": None,
        "rooms": [],
        "viewport": {"zoom": 1, "offsetX": 0, "offsetY": 0},
    }
