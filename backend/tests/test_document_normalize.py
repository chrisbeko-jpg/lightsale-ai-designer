import pytest

from app.document_normalize import (
    default_output_settings,
    normalize_output_settings,
    normalize_project_document,
)


def test_normalize_output_settings_null():
    result = normalize_output_settings(None, project_name="Demo")
    assert result["showLegend"] is True
    assert result["customerName"] == ""
    assert result["projectName"] == "Demo"


def test_normalize_output_settings_partial_merge():
    result = normalize_output_settings({"customerName": "Acme", "showLegend": False})
    assert result["customerName"] == "Acme"
    assert result["showLegend"] is False
    assert result["showScale"] is True


def test_normalize_project_document_null():
    doc = normalize_project_document(
        {"scale": None, "rooms": [], "luminaires": [], "outputSettings": None},
        project_name="Demo",
    )
    assert isinstance(doc["outputSettings"], dict)
    assert doc["outputSettings"]["showLuxSummary"] is True
    assert doc["outputSettings"]["projectName"] == "Demo"


def test_normalize_output_settings_null_project_name():
    result = normalize_output_settings(
        {"projectName": None, "customerName": None},
        project_name="Warehouse",
    )
    assert result["projectName"] == "Warehouse"
    assert result["customerName"] == ""


def test_default_document_includes_output_settings():
    from app.schemas import default_document

    doc = default_document()
    assert doc["outputSettings"] == default_output_settings()
