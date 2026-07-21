"""Normalize project document JSON stored in PostgreSQL."""

from __future__ import annotations

from copy import deepcopy
from typing import Any

# Keep in sync with packages/shared/src/output-settings.ts OUTPUT_SETTINGS_TEXT_FIELDS
OUTPUT_SETTINGS_TEXT_FIELDS = (
    "projectName",
    "customerName",
    "projectReference",
    "projectAddress",
    "designerName",
    "outputDate",
    "notes",
)

DEFAULT_OUTPUT_SETTINGS: dict[str, Any] = {
    "projectName": "",
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


def normalize_output_settings(
    value: Any,
    *,
    project_name: str | None = None,
) -> dict[str, Any]:
    if value is None or not isinstance(value, dict):
        merged = default_output_settings()
    else:
        merged = default_output_settings()
        merged.update(value)

    for key in OUTPUT_SETTINGS_TEXT_FIELDS:
        field_value = merged.get(key)
        if field_value is None:
            merged[key] = ""
        elif isinstance(field_value, str):
            merged[key] = field_value
        else:
            merged[key] = str(field_value)

    name = str(merged.get("projectName", "")).strip()
    fallback = (project_name or "").strip()
    if name:
        merged["projectName"] = name
    elif fallback:
        merged["projectName"] = fallback
    else:
        merged["projectName"] = ""

    return merged


def normalize_project_document(
    document: dict[str, Any],
    *,
    project_name: str | None = None,
) -> dict[str, Any]:
    doc = dict(document)
    doc["outputSettings"] = normalize_output_settings(
        doc.get("outputSettings"),
        project_name=project_name,
    )
    if "luminaires" not in doc or doc["luminaires"] is None:
        doc["luminaires"] = []
    if "rooms" not in doc or doc["rooms"] is None:
        doc["rooms"] = []
    return doc


def output_settings_needs_repair(document: dict[str, Any]) -> bool:
    """True when stored JSON may fail client validation or contains null text fields."""
    raw = document.get("outputSettings")
    if raw is None:
        return True
    if not isinstance(raw, dict):
        return True
    for key in OUTPUT_SETTINGS_TEXT_FIELDS:
        if key in raw and raw[key] is None:
            return True
    return False
