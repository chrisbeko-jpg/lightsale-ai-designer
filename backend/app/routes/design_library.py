import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_session
from app.design_library_models import (
    DesignLibraryFileRow,
    DesignLibraryInterpretationRow,
    DesignLibraryProjectRow,
    DesignLibraryRoomProductRow,
    DesignLibraryRoomRow,
    DesignNoteRow,
)
from app.design_library_schemas import (
    ApproveReferenceRequest,
    CreateDesignLibraryProjectRequest,
    CreateDesignNoteRequest,
    UpdateDesignLibraryFileRequest,
    UpdateDesignLibraryProjectRequest,
    UpdateDesignNoteRequest,
)
from app.design_library_service import (
    build_note_searchable_text,
    build_project_searchable_text,
    file_row_to_api,
    get_project_interpretation,
    normalize_interpretation_content,
    note_row_to_api,
    product_row_to_api,
    project_list_item,
    project_row_to_api,
    utc_now,
)
from app.design_library_upload import save_design_library_upload

router = APIRouter(prefix="/api/design-library", tags=["design-library"])


def _owner_id(x_owner_id: str | None = Header(default=None, alias="X-Owner-Id")) -> str:
    return (x_owner_id or "local").strip() or "local"


def _upload_root() -> Path:
    return Path(settings.upload_dir)


async def _get_project(
    project_id: uuid.UUID,
    session: AsyncSession,
    *,
    allow_deleted: bool = False,
) -> DesignLibraryProjectRow:
    result = await session.execute(
        select(DesignLibraryProjectRow)
        .where(DesignLibraryProjectRow.id == project_id)
        .options(
            selectinload(DesignLibraryProjectRow.files),
            selectinload(DesignLibraryProjectRow.rooms).selectinload(
                DesignLibraryRoomRow.products
            ),
            selectinload(DesignLibraryProjectRow.interpretations),
        )
    )
    row = result.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Referentieproject niet gevonden")
    if row.deleted_at is not None and not allow_deleted:
        raise HTTPException(status_code=404, detail="Referentieproject niet gevonden")
    return row


def _assert_owner(row: DesignLibraryProjectRow, owner_id: str) -> None:
    if row.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="Geen toegang tot dit referentieproject")


async def _all_products_for_project(
    project: DesignLibraryProjectRow,
) -> list[DesignLibraryRoomProductRow]:
    products: list[DesignLibraryRoomProductRow] = []
    for room in project.rooms:
        products.extend(room.products)
    return products


async def _refresh_searchable(
    project: DesignLibraryProjectRow,
    session: AsyncSession,
) -> None:
    interpretation = get_project_interpretation(project.interpretations)
    products = await _all_products_for_project(project)
    active_rooms = [r for r in project.rooms if r.deleted_at is None]
    project.searchable_text = build_project_searchable_text(
        project, active_rooms, products, interpretation
    )
    project.normalized_tags = list(
        {
            project.project_type,
            project.status,
            *(project.styles or []),
        }
    )
    project.updated_at = utc_now()


async def _sync_interpretation(
    project: DesignLibraryProjectRow,
    content: dict,
    session: AsyncSession,
) -> None:
    normalized = normalize_interpretation_content(content)
    existing = None
    for row in project.interpretations:
        if row.room_id is None:
            existing = row
            break
    if existing is None:
        existing = DesignLibraryInterpretationRow(
            project_id=project.id, room_id=None, content=normalized
        )
        session.add(existing)
        project.interpretations.append(existing)
    else:
        existing.content = normalized
        existing.updated_at = utc_now()


async def _replace_rooms(
    project: DesignLibraryProjectRow,
    rooms_input: list,
    session: AsyncSession,
) -> None:
    for room in list(project.rooms):
        await session.delete(room)
    await session.flush()
    project.rooms.clear()

    for index, room_data in enumerate(rooms_input):
        room_id = room_data.id or uuid.uuid4()
        room = DesignLibraryRoomRow(
            id=room_id,
            project_id=project.id,
            sort_order=index,
            name=room_data.name,
            room_type=room_data.roomType,
            area_square_metres=room_data.areaSquareMetres,
            length_metres=room_data.lengthMetres,
            width_metres=room_data.widthMetres,
            ceiling_height_metres=room_data.ceilingHeightMetres,
            ceiling_type=room_data.ceilingType,
            target_lux=room_data.targetLux,
            colour_temperature_kelvin=room_data.colourTemperatureKelvin,
            usage_function=room_data.usageFunction,
            style=room_data.style,
            budget_level=room_data.budgetLevel,
            notes=room_data.notes,
            placement=room_data.placement or {},
            room_interpretation=room_data.roomInterpretation,
        )
        session.add(room)
        project.rooms.append(room)
        for product_data in room_data.products:
            manual = {}
            if product_data.isManualHistorical:
                manual = {
                    "manualBrand": product_data.manualBrand,
                    "manualName": product_data.manualName,
                    "manualArticleNumber": product_data.manualArticleNumber,
                    "manualLumens": product_data.manualLumens,
                    "manualWatts": product_data.manualWatts,
                    "manualDimensionsLabel": product_data.manualDimensionsLabel,
                    "manualCategory": product_data.manualCategory,
                }
            product = DesignLibraryRoomProductRow(
                id=product_data.id or uuid.uuid4(),
                room_id=room_id,
                catalog_product_id=product_data.catalogProductId,
                is_manual_historical=product_data.isManualHistorical,
                manual_payload=manual,
                quantity=product_data.quantity,
                mounting_method=product_data.mountingMethod,
                color=product_data.color,
                dimming_method=product_data.dimmingMethod,
                notes=product_data.notes,
            )
            session.add(product)
            room.products.append(product)


def _project_response(project: DesignLibraryProjectRow) -> dict:
    interpretation = get_project_interpretation(project.interpretations)
    products = []
    for room in project.rooms:
        products.extend(room.products)
    return project_row_to_api(
        project,
        project.files,
        project.rooms,
        products,
        interpretation,
    )


@router.get("/projects")
async def list_design_library_projects(
    q: str | None = Query(default=None),
    project_type: str | None = Query(default=None, alias="projectType"),
    status: str | None = Query(default=None),
    trash: bool = Query(default=False),
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> list[dict]:
    result = await session.execute(
        select(DesignLibraryProjectRow)
        .where(DesignLibraryProjectRow.owner_id == owner_id)
        .options(
            selectinload(DesignLibraryProjectRow.files),
            selectinload(DesignLibraryProjectRow.rooms),
        )
        .order_by(DesignLibraryProjectRow.updated_at.desc())
    )
    rows = result.scalars().all()
    items: list[dict] = []
    for row in rows:
        in_trash = row.deleted_at is not None
        if trash != in_trash:
            continue
        if project_type and row.project_type != project_type:
            continue
        if status and row.status != status:
            continue
        if q:
            needle = q.strip().lower()
            if needle and needle not in row.searchable_text and needle not in row.name.lower():
                continue
        file_count = len([f for f in row.files if f.deleted_at is None])
        room_count = len([r for r in row.rooms if r.deleted_at is None])
        items.append(
            project_list_item(row, file_count=file_count, room_count=room_count)
        )
    return items


@router.post("/projects", status_code=201)
async def create_design_library_project(
    body: CreateDesignLibraryProjectRequest,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> dict:
    project = DesignLibraryProjectRow(
        name=body.name,
        client_name=body.clientName,
        project_number=body.projectNumber,
        year=body.year,
        project_type=body.projectType,
        location=body.location,
        designer=body.designer or "Lightsale",
        styles=body.styles,
        description=body.description,
        status=body.status,
        approval_status=body.status,
        owner_id=owner_id,
    )
    session.add(project)
    await session.flush()
    await _sync_interpretation(project, {}, session)
    await _refresh_searchable(project, session)
    await session.commit()
    await session.refresh(project)
    loaded = await _get_project(project.id, session)
    return _project_response(loaded)


@router.get("/projects/{project_id}")
async def get_design_library_project(
    project_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> dict:
    project = await _get_project(project_id, session)
    _assert_owner(project, owner_id)
    return _project_response(project)


@router.put("/projects/{project_id}")
async def update_design_library_project(
    project_id: uuid.UUID,
    body: UpdateDesignLibraryProjectRequest,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> dict:
    project = await _get_project(project_id, session)
    _assert_owner(project, owner_id)

    if body.name is not None:
        project.name = body.name
    if body.clientName is not None:
        project.client_name = body.clientName
    if body.projectNumber is not None:
        project.project_number = body.projectNumber
    if body.year is not None:
        project.year = body.year
    if body.projectType is not None:
        project.project_type = body.projectType
    if body.location is not None:
        project.location = body.location
    if body.designer is not None:
        project.designer = body.designer
    if body.styles is not None:
        project.styles = body.styles
    if body.description is not None:
        project.description = body.description
    if body.status is not None:
        project.status = body.status
        project.approval_status = body.status
    if body.referenceQuality is not None:
        project.reference_quality = body.referenceQuality
    if body.interpretation is not None:
        await _sync_interpretation(project, body.interpretation.model_dump(), session)
    if body.rooms is not None:
        await _replace_rooms(project, body.rooms, session)

    await _refresh_searchable(project, session)
    await session.commit()
    loaded = await _get_project(project_id, session)
    return _project_response(loaded)


@router.post("/projects/{project_id}/duplicate", status_code=201)
async def duplicate_design_library_project(
    project_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> dict:
    source = await _get_project(project_id, session)
    _assert_owner(source, owner_id)

    copy = DesignLibraryProjectRow(
        name=f"{source.name} (kopie)",
        client_name=source.client_name,
        project_number=source.project_number,
        year=source.year,
        project_type=source.project_type,
        location=source.location,
        designer=source.designer,
        styles=list(source.styles or []),
        description=source.description,
        status="concept",
        approval_status="concept",
        owner_id=owner_id,
        searchable_text=source.searchable_text,
        normalized_tags=list(source.normalized_tags or []),
        reference_quality=source.reference_quality,
        source_type=source.source_type,
        extraction_status=source.extraction_status,
    )
    session.add(copy)
    await session.flush()

    for interp in source.interpretations:
        if interp.room_id is None:
            session.add(
                DesignLibraryInterpretationRow(
                    project_id=copy.id,
                    room_id=None,
                    content=dict(interp.content or {}),
                )
            )

    room_id_map: dict[uuid.UUID, uuid.UUID] = {}
    for room in source.rooms:
        if room.deleted_at is not None:
            continue
        new_room_id = uuid.uuid4()
        room_id_map[room.id] = new_room_id
        new_room = DesignLibraryRoomRow(
            id=new_room_id,
            project_id=copy.id,
            sort_order=room.sort_order,
            name=room.name,
            room_type=room.room_type,
            area_square_metres=room.area_square_metres,
            length_metres=room.length_metres,
            width_metres=room.width_metres,
            ceiling_height_metres=room.ceiling_height_metres,
            ceiling_type=room.ceiling_type,
            target_lux=room.target_lux,
            colour_temperature_kelvin=room.colour_temperature_kelvin,
            usage_function=room.usage_function,
            style=room.style,
            budget_level=room.budget_level,
            notes=room.notes,
            placement=dict(room.placement or {}),
            room_interpretation=room.room_interpretation,
        )
        session.add(new_room)
        for product in room.products:
            session.add(
                DesignLibraryRoomProductRow(
                    room_id=new_room_id,
                    catalog_product_id=product.catalog_product_id,
                    is_manual_historical=product.is_manual_historical,
                    manual_payload=dict(product.manual_payload or {}),
                    quantity=product.quantity,
                    mounting_method=product.mounting_method,
                    color=product.color,
                    dimming_method=product.dimming_method,
                    notes=product.notes,
                )
            )

    for file_row in source.files:
        if file_row.deleted_at is not None:
            continue
        src_path = Path(file_row.storage_path)
        if not src_path.exists():
            continue
        target_dir = _upload_root() / "design-library" / str(copy.id)
        target_dir.mkdir(parents=True, exist_ok=True)
        dest = target_dir / f"{copy.id}_{uuid.uuid4()}{src_path.suffix}"
        shutil.copy2(src_path, dest)
        session.add(
            DesignLibraryFileRow(
                project_id=copy.id,
                file_name=file_row.file_name,
                mime_type=file_row.mime_type,
                size_bytes=file_row.size_bytes,
                storage_path=str(dest),
                category=file_row.category,
                description=file_row.description,
                is_primary=file_row.is_primary,
                upload_status=file_row.upload_status,
            )
        )

    await _refresh_searchable(copy, session)
    await session.commit()
    loaded = await _get_project(copy.id, session)
    return _project_response(loaded)


@router.delete("/projects/{project_id}")
async def soft_delete_design_library_project(
    project_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> dict[str, str]:
    project = await _get_project(project_id, session)
    _assert_owner(project, owner_id)
    project.deleted_at = utc_now()
    project.deleted_by = owner_id
    await session.commit()
    return {"status": "deleted"}


@router.post("/projects/{project_id}/restore")
async def restore_design_library_project(
    project_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> dict:
    project = await _get_project(project_id, session, allow_deleted=True)
    _assert_owner(project, owner_id)
    project.deleted_at = None
    project.deleted_by = None
    await session.commit()
    loaded = await _get_project(project_id, session)
    return _project_response(loaded)


@router.delete("/projects/{project_id}/permanent")
async def permanent_delete_design_library_project(
    project_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> dict[str, str]:
    project = await _get_project(project_id, session, allow_deleted=True)
    _assert_owner(project, owner_id)
    target_dir = _upload_root() / "design-library" / str(project.id)
    if target_dir.exists():
        shutil.rmtree(target_dir, ignore_errors=True)
    await session.delete(project)
    await session.commit()
    return {"status": "purged"}


@router.post("/projects/{project_id}/approve-reference")
async def approve_reference_project(
    project_id: uuid.UUID,
    body: ApproveReferenceRequest,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> dict:
    if not body.confirm:
        raise HTTPException(
            status_code=400,
            detail="Bevestig goedkeuring als referentieproject.",
        )
    project = await _get_project(project_id, session)
    _assert_owner(project, owner_id)
    project.status = "approved_reference"
    project.approval_status = "approved_reference"
    await _refresh_searchable(project, session)
    await session.commit()
    loaded = await _get_project(project_id, session)
    return _project_response(loaded)


@router.post("/projects/{project_id}/files", status_code=201)
async def upload_design_library_file(
    project_id: uuid.UUID,
    file: UploadFile = File(...),
    category: str = Form(default="other"),
    description: str = Form(default=""),
    is_primary: bool = Form(default=False),
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> dict:
    project = await _get_project(project_id, session)
    _assert_owner(project, owner_id)
    try:
        file_name, mime_type, size_bytes, storage_path = await save_design_library_upload(
            file, _upload_root(), project_id
        )
    except HTTPException:
        raise
    except OSError as exc:
        raise HTTPException(status_code=500, detail="Bestand opslaan mislukt") from exc

    row = DesignLibraryFileRow(
        project_id=project_id,
        file_name=file_name,
        mime_type=mime_type,
        size_bytes=size_bytes,
        storage_path=storage_path,
        category=category,
        description=description or None,
        is_primary=is_primary,
        upload_status="uploaded",
    )
    session.add(row)
    await _refresh_searchable(project, session)
    await session.commit()
    await session.refresh(row)
    return file_row_to_api(row)


@router.patch("/projects/{project_id}/files/{file_id}")
async def update_design_library_file(
    project_id: uuid.UUID,
    file_id: uuid.UUID,
    body: UpdateDesignLibraryFileRequest,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> dict:
    project = await _get_project(project_id, session)
    _assert_owner(project, owner_id)
    row = next((f for f in project.files if f.id == file_id), None)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Bestand niet gevonden")
    if body.category is not None:
        row.category = body.category
    if body.description is not None:
        row.description = body.description
    if body.isPrimary is not None:
        row.is_primary = body.isPrimary
    await session.commit()
    await session.refresh(row)
    return file_row_to_api(row)


@router.delete("/projects/{project_id}/files/{file_id}")
async def delete_design_library_file(
    project_id: uuid.UUID,
    file_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> dict[str, str]:
    project = await _get_project(project_id, session)
    _assert_owner(project, owner_id)
    row = next((f for f in project.files if f.id == file_id), None)
    if row is None:
        raise HTTPException(status_code=404, detail="Bestand niet gevonden")
    row.deleted_at = utc_now()
    path = Path(row.storage_path)
    if path.exists():
        path.unlink(missing_ok=True)
    await session.commit()
    return {"status": "deleted"}


@router.get("/projects/{project_id}/files/{file_id}/download")
async def download_design_library_file(
    project_id: uuid.UUID,
    file_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> FileResponse:
    project = await _get_project(project_id, session)
    _assert_owner(project, owner_id)
    row = next((f for f in project.files if f.id == file_id), None)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Bestand niet gevonden")
    path = Path(row.storage_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Bestand niet meer beschikbaar")
    return FileResponse(
        path,
        media_type=row.mime_type,
        filename=row.file_name,
    )


@router.get("/notes")
async def list_design_notes(
    q: str | None = Query(default=None),
    trash: bool = Query(default=False),
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> list[dict]:
    result = await session.execute(
        select(DesignNoteRow)
        .where(DesignNoteRow.owner_id == owner_id)
        .order_by(DesignNoteRow.updated_at.desc())
    )
    notes = result.scalars().all()
    items: list[dict] = []
    for note in notes:
        in_trash = note.deleted_at is not None
        if trash != in_trash:
            continue
        if q:
            needle = q.strip().lower()
            if needle and needle not in note.searchable_text:
                continue
        items.append(note_row_to_api(note))
    return items


@router.post("/notes", status_code=201)
async def create_design_note(
    body: CreateDesignNoteRequest,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> dict:
    note = DesignNoteRow(
        owner_id=owner_id,
        title=body.title,
        category=body.category,
        room_type=body.roomType,
        project_type=body.projectType,
        rule_text=body.ruleText,
        priority=body.priority,
        status=body.status,
        source=body.source,
    )
    note.searchable_text = build_note_searchable_text(note)
    session.add(note)
    await session.commit()
    await session.refresh(note)
    return note_row_to_api(note)


@router.patch("/notes/{note_id}")
async def update_design_note(
    note_id: uuid.UUID,
    body: UpdateDesignNoteRequest,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> dict:
    result = await session.execute(select(DesignNoteRow).where(DesignNoteRow.id == note_id))
    note = result.scalar_one_or_none()
    if note is None or note.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Ontwerpnotitie niet gevonden")
    if note.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="Geen toegang")
    if body.title is not None:
        note.title = body.title
    if body.category is not None:
        note.category = body.category
    if body.roomType is not None:
        note.room_type = body.roomType
    if body.projectType is not None:
        note.project_type = body.projectType
    if body.ruleText is not None:
        note.rule_text = body.ruleText
    if body.priority is not None:
        note.priority = body.priority
    if body.status is not None:
        note.status = body.status
    if body.source is not None:
        note.source = body.source
    note.searchable_text = build_note_searchable_text(note)
    note.updated_at = utc_now()
    await session.commit()
    await session.refresh(note)
    return note_row_to_api(note)


@router.delete("/notes/{note_id}")
async def delete_design_note(
    note_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> dict[str, str]:
    result = await session.execute(select(DesignNoteRow).where(DesignNoteRow.id == note_id))
    note = result.scalar_one_or_none()
    if note is None:
        raise HTTPException(status_code=404, detail="Ontwerpnotitie niet gevonden")
    if note.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="Geen toegang")
    note.deleted_at = utc_now()
    await session.commit()
    return {"status": "deleted"}


@router.post("/notes/{note_id}/restore")
async def restore_design_note(
    note_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> dict:
    result = await session.execute(select(DesignNoteRow).where(DesignNoteRow.id == note_id))
    note = result.scalar_one_or_none()
    if note is None:
        raise HTTPException(status_code=404, detail="Ontwerpnotitie niet gevonden")
    if note.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="Geen toegang")
    note.deleted_at = None
    await session.commit()
    await session.refresh(note)
    return note_row_to_api(note)
