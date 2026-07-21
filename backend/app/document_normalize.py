"""Normalize project document JSON stored in PostgreSQL."""

from __future__ import annotations

from copy import deepcopy
from typing import Any

DEFAULT_OUTPUT_SETTINGS: dict[str, Any] = {
    "customerName": "",
    "projectReference": "",
    "projectAddress": "",
    "designerName": "",
    "outputDate": "",
    "notes": "",
    "showFloorPlanBackground": True,
    "showRoomOutlines": True,
    "showRoomNames": True,
    "showLuminaireSymbols": True,
    "showLuminaireNumbers": False,
    "showScale": True,
    "showLegend": True,
    "showLightIndicator": False,
    "includeLightIndicatorInPdf": False,
    "showLuxSummary": True,
    "showComplianceStatus": True,
}


def default_output_settings() -> dict[str, Any]:
    return deepcopy(DEFAULT_OUTPUT_SETTINGS)


def normalize_output_settings(value: Any) -> dict[str, Any]:
    if value is None or not isinstance(value, dict):
        return default_output_settings()
    merged = default_output_settings()
    merged.update(value)
    return merged


def normalize_project_document(document: dict[str, Any]) -> dict[str, Any]:
    doc = dict(document)
    doc["outputSettings"] = normalize_output_settings(doc.get("outputSettings"))
    if "luminaires" not in doc or doc["luminaires"] is None:
        doc["luminaires"] = []
    if "rooms" not in doc or doc["rooms"] is None:
        doc["rooms"] = []
    return doc
