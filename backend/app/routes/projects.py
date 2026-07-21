import shutil
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, Header, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_session
from app.floor_plan_upload import save_floor_plan_upload
from app.models import FloorPlanRow, ProjectRow
from app.schemas import (
    CreateProjectRequest,
    FloorPlanAssetModel,
    ProjectDocumentModel,
    ProjectListItem,
    ProjectModel,
    ProjectTrashStats,
    RenameProjectRequest,
    UpdateProjectDocumentRequest,
    default_document,
)

router = APIRouter(prefix="/api/projects", tags=["projects"])

TRASH_RETENTION_DAYS = 30


def _owner_id(x_owner_id: str | None = Header(default=None, alias="X-Owner-Id")) -> str:
    return (x_owner_id or "local").strip() or "local"


def _document_counts(document: dict) -> tuple[int, int, str]:
    rooms = document.get("rooms") or []
    luminaires = document.get("luminaires") or []
    output = document.get("outputSettings") or {}
    customer = ""
    if isinstance(output, dict):
        customer = str(output.get("customerName") or "")
    return len(rooms), len(luminaires), customer


def _to_project_model(
    row: ProjectRow, floor_plan: FloorPlanRow | None
) -> ProjectModel:
    floor_plan_model = None
    if floor_plan is not None:
        floor_plan_model = FloorPlanAssetModel(
            id=floor_plan.id,
            fileName=floor_plan.file_name,
            mimeType=floor_plan.mime_type,
            widthPx=floor_plan.width_px,
            heightPx=floor_plan.height_px,
            storagePath=floor_plan.storage_path,
        )

    return ProjectModel(
        id=row.id,
        name=row.name,
        createdAt=row.created_at,
        updatedAt=row.updated_at,
        floorPlan=floor_plan_model,
        document=ProjectDocumentModel.model_validate(row.document),
    )


def _assert_owner(row: ProjectRow, owner_id: str) -> None:
    if row.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="Not allowed to access this project")


async def _get_project_row(
    project_id: uuid.UUID,
    session: AsyncSession,
    *,
    allow_deleted: bool = False,
) -> ProjectRow:
    result = await session.execute(
        select(ProjectRow).where(ProjectRow.id == project_id)
    )
    row = result.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if row.deleted_at is not None and not allow_deleted:
        raise HTTPException(status_code=404, detail="Project not found")
    return row


async def _get_floor_plan(
    project_id: uuid.UUID, session: AsyncSession
) -> FloorPlanRow | None:
    result = await session.execute(
        select(FloorPlanRow).where(FloorPlanRow.project_id == project_id)
    )
    return result.scalar_one_or_none()


async def _list_item_from_row(
    row: ProjectRow, session: AsyncSession
) -> ProjectListItem:
    floor_plan = await _get_floor_plan(row.id, session)
    room_count, luminaire_count, customer = _document_counts(row.document)
    return ProjectListItem(
        id=row.id,
        name=row.name,
        createdAt=row.created_at,
        updatedAt=row.updated_at,
        hasFloorPlan=floor_plan is not None,
        customerName=customer,
        roomCount=room_count,
        luminaireCount=luminaire_count,
    )


async def _delete_floor_plan_files(
    floor_plan: FloorPlanRow | None,
) -> None:
    if floor_plan is None:
        return
    path = Path(floor_plan.storage_path)
    if path.exists():
        path.unlink()


@router.get("/stats/trash", response_model=ProjectTrashStats)
async def project_trash_stats(
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> ProjectTrashStats:
    result = await session.execute(select(ProjectRow).where(ProjectRow.owner_id == owner_id))
    rows = result.scalars().all()
    active = sum(1 for row in rows if row.deleted_at is None)
    trash = sum(1 for row in rows if row.deleted_at is not None)
    total_bytes: int | None = 0
    try:
        for row in rows:
            floor_plan = await _get_floor_plan(row.id, session)
            if floor_plan is not None:
                path = Path(floor_plan.storage_path)
                if path.exists():
                    total_bytes += path.stat().st_size
    except OSError:
        total_bytes = None
    return ProjectTrashStats(
        activeProjectCount=active,
        trashProjectCount=trash,
        totalUploadedBytes=total_bytes,
    )


@router.get("", response_model=list[ProjectListItem])
async def list_projects(
    trash: bool = Query(default=False),
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> list[ProjectListItem]:
    result = await session.execute(
        select(ProjectRow)
        .where(ProjectRow.owner_id == owner_id)
        .order_by(ProjectRow.updated_at.desc())
    )
    rows = result.scalars().all()
    items: list[ProjectListItem] = []
    for row in rows:
        in_trash = row.deleted_at is not None
        if trash != in_trash:
            continue
        items.append(await _list_item_from_row(row, session))
    return items


@router.post("", response_model=ProjectModel, status_code=201)
async def create_project(
    body: CreateProjectRequest,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> ProjectModel:
    row = ProjectRow(name=body.name, document=default_document(), owner_id=owner_id)
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return _to_project_model(row, None)


@router.get("/{project_id}", response_model=ProjectModel)
async def get_project(
    project_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> ProjectModel:
    row = await _get_project_row(project_id, session)
    _assert_owner(row, owner_id)
    floor_plan = await _get_floor_plan(project_id, session)
    return _to_project_model(row, floor_plan)


@router.patch("/{project_id}", response_model=ProjectModel)
async def rename_project(
    project_id: uuid.UUID,
    body: RenameProjectRequest,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> ProjectModel:
    row = await _get_project_row(project_id, session)
    _assert_owner(row, owner_id)
    row.name = body.name
    row.updated_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(row)
    floor_plan = await _get_floor_plan(project_id, session)
    return _to_project_model(row, floor_plan)


@router.post("/{project_id}/duplicate", response_model=ProjectModel, status_code=201)
async def duplicate_project(
    project_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> ProjectModel:
    row = await _get_project_row(project_id, session, allow_deleted=False)
    _assert_owner(row, owner_id)
    floor_plan = await _get_floor_plan(project_id, session)
    copy = ProjectRow(
        name=f"{row.name} (copy)",
        document=dict(row.document),
        owner_id=owner_id,
    )
    session.add(copy)
    await session.flush()
    new_floor_plan = None
    if floor_plan is not None:
        src = Path(floor_plan.storage_path)
        if src.exists():
            dest = src.parent / f"{copy.id}_{src.name}"
            shutil.copy2(src, dest)
            new_floor_plan = FloorPlanRow(
                project_id=copy.id,
                file_name=floor_plan.file_name,
                mime_type=floor_plan.mime_type,
                width_px=floor_plan.width_px,
                height_px=floor_plan.height_px,
                storage_path=str(dest),
            )
            session.add(new_floor_plan)
            copy.floor_plan_id = new_floor_plan.id
    await session.commit()
    await session.refresh(copy)
    if new_floor_plan is not None:
        await session.refresh(new_floor_plan)
    return _to_project_model(copy, new_floor_plan)


@router.post("/{project_id}/trash", response_model=ProjectListItem)
async def trash_project(
    project_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> ProjectListItem:
    row = await _get_project_row(project_id, session)
    _assert_owner(row, owner_id)
    now = datetime.now(timezone.utc)
    row.deleted_at = now
    row.deleted_by = owner_id
    row.deletion_scheduled_at = now + timedelta(days=TRASH_RETENTION_DAYS)
    row.updated_at = now
    await session.commit()
    await session.refresh(row)
    return await _list_item_from_row(row, session)


@router.post("/{project_id}/restore", response_model=ProjectListItem)
async def restore_project(
    project_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> ProjectListItem:
    row = await _get_project_row(project_id, session, allow_deleted=True)
    _assert_owner(row, owner_id)
    row.deleted_at = None
    row.deleted_by = None
    row.deletion_scheduled_at = None
    row.updated_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(row)
    return await _list_item_from_row(row, session)


@router.delete("/{project_id}/permanent", status_code=204)
async def permanently_delete_project(
    project_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> None:
    row = await _get_project_row(project_id, session, allow_deleted=True)
    _assert_owner(row, owner_id)
    floor_plan = await _get_floor_plan(project_id, session)
    await _delete_floor_plan_files(floor_plan)
    if floor_plan is not None:
        await session.delete(floor_plan)
    await session.delete(row)
    await session.commit()


@router.put("/{project_id}/document", response_model=ProjectModel)
async def update_project_document(
    project_id: uuid.UUID,
    body: UpdateProjectDocumentRequest,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> ProjectModel:
    row = await _get_project_row(project_id, session)
    _assert_owner(row, owner_id)
    row.document = body.model_dump(mode="json")
    row.updated_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(row)
    floor_plan = await _get_floor_plan(project_id, session)
    return _to_project_model(row, floor_plan)


@router.post("/{project_id}/floor-plan", response_model=ProjectModel)
async def upload_floor_plan(
    project_id: uuid.UUID,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> ProjectModel:
    row = await _get_project_row(project_id, session)
    _assert_owner(row, owner_id)
    upload_dir = Path(settings.upload_dir)

    file_name, mime_type, width_px, height_px, storage_path = (
        await save_floor_plan_upload(file, upload_dir, project_id)
    )

    existing = await _get_floor_plan(project_id, session)
    if existing is not None:
        old_path = Path(existing.storage_path)
        if old_path.exists():
            old_path.unlink()
        await session.delete(existing)

    floor_plan = FloorPlanRow(
        project_id=project_id,
        file_name=file_name,
        mime_type=mime_type,
        width_px=width_px,
        height_px=height_px,
        storage_path=storage_path,
    )
    session.add(floor_plan)
    row.floor_plan_id = floor_plan.id
    row.updated_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(row)
    await session.refresh(floor_plan)
    return _to_project_model(row, floor_plan)


@router.get("/{project_id}/floor-plan/file")
async def get_floor_plan_file(
    project_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    owner_id: str = Depends(_owner_id),
) -> FileResponse:
    row = await _get_project_row(project_id, session, allow_deleted=True)
    _assert_owner(row, owner_id)
    floor_plan = await _get_floor_plan(project_id, session)
    if floor_plan is None:
        raise HTTPException(status_code=404, detail="Floor plan not found")

    path = Path(floor_plan.storage_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Floor plan file missing")

    return FileResponse(
        path,
        media_type=floor_plan.mime_type,
        filename=floor_plan.file_name,
    )
