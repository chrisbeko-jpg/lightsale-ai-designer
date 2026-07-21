from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from app.design_library_models import (
    DesignLibraryFileRow,
    DesignLibraryInterpretationRow,
    DesignLibraryProjectRow,
    DesignLibraryRoomProductRow,
    DesignLibraryRoomRow,
    DesignNoteRow,
)


def _safe_str(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def default_interpretation_content() -> dict[str, str]:
    return {
        "mainRationale": "",
        "designGoal": "",
        "functionalRequirements": "",
        "aestheticRequirements": "",
        "constraints": "",
        "deliberateDeviations": "",
        "workedWell": "",
        "wouldChange": "",
        "clientFeedback": "",
        "designRulesLearned": "",
    }


def normalize_interpretation_content(raw: dict | None) -> dict[str, str]:
    base = default_interpretation_content()
    if not isinstance(raw, dict):
        return base
    for key in base:
        if key in raw and raw[key] is not None:
            base[key] = _safe_str(raw[key])
    return base


def build_project_searchable_text(
    project: DesignLibraryProjectRow,
    rooms: list[DesignLibraryRoomRow],
    products: list[DesignLibraryRoomProductRow],
    interpretation: dict[str, str],
) -> str:
    parts = [
        project.name,
        _safe_str(project.client_name),
        _safe_str(project.project_number),
        project.project_type,
        _safe_str(project.location),
        _safe_str(project.description),
        " ".join(project.styles or []),
    ]
    for key, value in interpretation.items():
        parts.append(value)
    for room in rooms:
        parts.extend(
            [
                room.name,
                room.room_type,
                _safe_str(room.style),
                _safe_str(room.usage_function),
                _safe_str(room.notes),
                _safe_str(room.room_interpretation),
            ]
        )
    for product in products:
        parts.append(_safe_str(product.catalog_product_id))
        if product.is_manual_historical and isinstance(product.manual_payload, dict):
            parts.extend(
                [
                    _safe_str(product.manual_payload.get("manualName")),
                    _safe_str(product.manual_payload.get("manualBrand")),
                    _safe_str(product.manual_payload.get("manualArticleNumber")),
                ]
            )
    return " ".join(part for part in parts if part).lower()


def build_note_searchable_text(note: DesignNoteRow) -> str:
    return " ".join(
        part
        for part in [
            note.title,
            note.category,
            _safe_str(note.room_type),
            _safe_str(note.project_type),
            note.rule_text,
            _safe_str(note.source),
        ]
        if part
    ).lower()


def product_row_to_api(row: DesignLibraryRoomProductRow) -> dict[str, Any]:
    manual = row.manual_payload if isinstance(row.manual_payload, dict) else {}
    return {
        "id": str(row.id),
        "catalogProductId": row.catalog_product_id,
        "isManualHistorical": row.is_manual_historical,
        "manualBrand": manual.get("manualBrand"),
        "manualName": manual.get("manualName"),
        "manualArticleNumber": manual.get("manualArticleNumber"),
        "manualLumens": manual.get("manualLumens"),
        "manualWatts": manual.get("manualWatts"),
        "manualDimensionsLabel": manual.get("manualDimensionsLabel"),
        "manualCategory": manual.get("manualCategory"),
        "quantity": row.quantity,
        "mountingMethod": row.mounting_method,
        "color": row.color,
        "dimmingMethod": row.dimming_method,
        "notes": row.notes,
    }


def room_row_to_api(
    row: DesignLibraryRoomRow, products: list[DesignLibraryRoomProductRow]
) -> dict[str, Any]:
    room_products = [product_row_to_api(p) for p in products if p.room_id == row.id]
    return {
        "id": str(row.id),
        "name": row.name,
        "roomType": row.room_type,
        "areaSquareMetres": row.area_square_metres,
        "lengthMetres": row.length_metres,
        "widthMetres": row.width_metres,
        "ceilingHeightMetres": row.ceiling_height_metres,
        "ceilingType": row.ceiling_type,
        "targetLux": row.target_lux,
        "colourTemperatureKelvin": row.colour_temperature_kelvin,
        "usageFunction": row.usage_function,
        "style": row.style,
        "budgetLevel": row.budget_level,
        "notes": row.notes,
        "placement": row.placement or {},
        "roomInterpretation": row.room_interpretation,
        "products": room_products,
    }


def file_row_to_api(row: DesignLibraryFileRow) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "projectId": str(row.project_id),
        "fileName": row.file_name,
        "mimeType": row.mime_type,
        "sizeBytes": row.size_bytes,
        "category": row.category,
        "description": row.description,
        "isPrimary": row.is_primary,
        "uploadStatus": row.upload_status,
        "createdAt": row.created_at.isoformat(),
    }


def project_row_to_api(
    project: DesignLibraryProjectRow,
    files: list[DesignLibraryFileRow],
    rooms: list[DesignLibraryRoomRow],
    products: list[DesignLibraryRoomProductRow],
    interpretation: dict[str, str],
) -> dict[str, Any]:
    active_files = [f for f in files if f.deleted_at is None]
    active_rooms = [r for r in rooms if r.deleted_at is None]
    return {
        "id": str(project.id),
        "name": project.name,
        "clientName": project.client_name,
        "projectNumber": project.project_number,
        "year": project.year,
        "projectType": project.project_type,
        "location": project.location,
        "designer": project.designer or "Lightsale",
        "styles": project.styles or [],
        "description": project.description,
        "status": project.status,
        "interpretation": interpretation,
        "rooms": [room_row_to_api(room, products) for room in active_rooms],
        "searchableText": project.searchable_text,
        "normalizedTags": project.normalized_tags or [],
        "approvalStatus": project.approval_status,
        "referenceQuality": project.reference_quality,
        "sourceType": project.source_type,
        "extractionStatus": project.extraction_status,
        "createdAt": project.created_at.isoformat(),
        "updatedAt": project.updated_at.isoformat(),
        "deletedAt": project.deleted_at.isoformat() if project.deleted_at else None,
        "fileCount": len(active_files),
        "roomCount": len(active_rooms),
        "files": [file_row_to_api(f) for f in active_files],
    }


def project_list_item(
    project: DesignLibraryProjectRow,
    *,
    file_count: int,
    room_count: int,
) -> dict[str, Any]:
    return {
        "id": str(project.id),
        "name": project.name,
        "projectType": project.project_type,
        "year": project.year,
        "roomCount": room_count,
        "fileCount": file_count,
        "status": project.status,
        "createdAt": project.created_at.isoformat(),
        "updatedAt": project.updated_at.isoformat(),
    }


def note_row_to_api(note: DesignNoteRow) -> dict[str, Any]:
    return {
        "id": str(note.id),
        "title": note.title,
        "category": note.category,
        "roomType": note.room_type,
        "projectType": note.project_type,
        "ruleText": note.rule_text,
        "priority": note.priority,
        "status": note.status,
        "source": note.source,
        "createdAt": note.created_at.isoformat(),
        "updatedAt": note.updated_at.isoformat(),
        "deletedAt": note.deleted_at.isoformat() if note.deleted_at else None,
    }


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def new_uuid() -> uuid.UUID:
    return uuid.uuid4()


def get_project_interpretation(
    rows: list[DesignLibraryInterpretationRow],
) -> dict[str, str]:
    for row in rows:
        if row.room_id is None:
            return normalize_interpretation_content(row.content)
    return default_interpretation_content()
