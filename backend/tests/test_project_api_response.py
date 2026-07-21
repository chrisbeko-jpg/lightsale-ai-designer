import json
from datetime import datetime, timezone
from uuid import uuid4

import pytest

from app.document_normalize import normalize_output_settings, normalize_project_document
from app.schemas import ProjectDocumentModel, ProjectModel


def _assert_no_null_output_text_fields(payload: dict) -> None:
    settings = payload.get("document", {}).get("outputSettings", {})
    assert isinstance(settings, dict)
    for key, value in settings.items():
        if key.endswith("Name") or key in {
            "projectReference",
            "projectAddress",
            "outputDate",
            "notes",
            "projectName",
        }:
            assert value is not None, f"{key} must not be null in API JSON"


def _build_project_model(document: dict, *, name: str = "Demo") -> ProjectModel:
    normalized = normalize_project_document(document, project_name=name)
    doc_model = ProjectDocumentModel.model_validate(normalized)
    return ProjectModel(
        id=uuid4(),
        name=name,
        createdAt=datetime.now(timezone.utc),
        updatedAt=datetime.now(timezone.utc),
        floorPlan=None,
        document=doc_model,
    )


@pytest.mark.parametrize(
    "raw_settings",
    [
        None,
        {},
        {"projectName": None},
        {"customerName": None, "notes": None, "projectName": None},
        {"customerName": "Acme", "showLegend": False},
    ],
)
def test_project_api_json_never_has_null_output_text_fields(raw_settings):
    document = {
        "scale": None,
        "rooms": [],
        "luminaires": [],
        "outputSettings": raw_settings,
    }
    model = _build_project_model(document, name="Warehouse A")
    payload = json.loads(model.model_dump_json())
    _assert_no_null_output_text_fields(payload)
    assert payload["document"]["outputSettings"]["projectName"] == "Warehouse A"


def test_normalize_output_settings_cases():
    assert normalize_output_settings(None, project_name="P")["projectName"] == "P"
    assert normalize_output_settings({}, project_name="P")["projectName"] == "P"
    assert normalize_output_settings({"projectName": None}, project_name="P")[
        "projectName"
    ] == "P"
    assert normalize_output_settings({"projectName": "Custom"})["projectName"] == "Custom"
    merged = normalize_output_settings(
        {"customerName": None, "notes": None, "projectReference": None},
        project_name="P",
    )
    assert merged["customerName"] == ""
    assert merged["notes"] == ""
    assert merged["projectReference"] == ""


def test_valid_output_settings_unchanged_values():
    original = {
        "customerName": "Acme",
        "showLegend": False,
        "projectName": "Saved title",
    }
    result = normalize_output_settings(original, project_name="Fallback")
    assert result["customerName"] == "Acme"
    assert result["showLegend"] is False
    assert result["projectName"] == "Saved title"
