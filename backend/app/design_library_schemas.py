from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class InterpretationContentModel(BaseModel):
    mainRationale: str = ""
    designGoal: str = ""
    functionalRequirements: str = ""
    aestheticRequirements: str = ""
    constraints: str = ""
    deliberateDeviations: str = ""
    workedWell: str = ""
    wouldChange: str = ""
    clientFeedback: str = ""
    designRulesLearned: str = ""


class RoomProductInput(BaseModel):
    id: UUID | None = None
    catalogProductId: str | None = None
    isManualHistorical: bool = False
    manualBrand: str | None = None
    manualName: str | None = None
    manualArticleNumber: str | None = None
    manualLumens: float | None = None
    manualWatts: float | None = None
    manualDimensionsLabel: str | None = None
    manualCategory: str | None = None
    quantity: int = Field(default=1, ge=1)
    mountingMethod: str | None = None
    color: str | None = None
    dimmingMethod: str | None = None
    notes: str | None = None


class RoomInput(BaseModel):
    id: UUID | None = None
    name: str = Field(min_length=1, max_length=200)
    roomType: str = "other"
    areaSquareMetres: float | None = Field(default=None, gt=0)
    lengthMetres: float | None = Field(default=None, gt=0)
    widthMetres: float | None = Field(default=None, gt=0)
    ceilingHeightMetres: float | None = Field(default=None, gt=0)
    ceilingType: str | None = None
    targetLux: float | None = Field(default=None, gt=0)
    colourTemperatureKelvin: float | None = Field(default=None, gt=0)
    usageFunction: str | None = None
    style: str | None = None
    budgetLevel: str | None = None
    notes: str | None = None
    placement: dict[str, Any] = Field(default_factory=dict)
    roomInterpretation: str | None = None
    products: list[RoomProductInput] = Field(default_factory=list)


class CreateDesignLibraryProjectRequest(BaseModel):
    name: str = Field(min_length=1, max_length=300)
    clientName: str | None = None
    projectNumber: str | None = None
    year: int | None = Field(default=None, ge=1900, le=2100)
    projectType: str = "other"
    location: str | None = None
    designer: str = "Lightsale"
    styles: list[str] = Field(default_factory=list)
    description: str | None = None
    status: str = "concept"


class UpdateDesignLibraryProjectRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=300)
    clientName: str | None = None
    projectNumber: str | None = None
    year: int | None = Field(default=None, ge=1900, le=2100)
    projectType: str | None = None
    location: str | None = None
    designer: str | None = None
    styles: list[str] | None = None
    description: str | None = None
    status: str | None = None
    interpretation: InterpretationContentModel | None = None
    rooms: list[RoomInput] | None = None
    referenceQuality: str | None = None


class UpdateDesignLibraryFileRequest(BaseModel):
    category: str | None = None
    description: str | None = None
    isPrimary: bool | None = None


class CreateDesignNoteRequest(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    category: str = "other"
    roomType: str | None = None
    projectType: str | None = None
    ruleText: str = Field(min_length=1)
    priority: str = "normal"
    status: str = "concept"
    source: str | None = None


class UpdateDesignNoteRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    category: str | None = None
    roomType: str | None = None
    projectType: str | None = None
    ruleText: str | None = Field(default=None, min_length=1)
    priority: str | None = None
    status: str | None = None
    source: str | None = None


class ApproveReferenceRequest(BaseModel):
    confirm: bool = False
