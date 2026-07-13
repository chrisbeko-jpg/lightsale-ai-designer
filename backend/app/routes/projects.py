import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
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
    UpdateProjectDocumentRequest,
    default_document,
)

router = APIRouter(prefix="/api/projects", tags=["projects"])


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


async def _get_project_row(
    project_id: uuid.UUID, session: AsyncSession
) -> ProjectRow:
    result = await session.execute(
        select(ProjectRow).where(ProjectRow.id == project_id)
    )
    row = result.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return row


async def _get_floor_plan(
    project_id: uuid.UUID, session: AsyncSession
) -> FloorPlanRow | None:
    result = await session.execute(
        select(FloorPlanRow).where(FloorPlanRow.project_id == project_id)
    )
    return result.scalar_one_or_none()


@router.get("", response_model=list[ProjectListItem])
async def list_projects(
    session: AsyncSession = Depends(get_session),
) -> list[ProjectListItem]:
    result = await session.execute(
        select(ProjectRow).order_by(ProjectRow.updated_at.desc())
    )
    rows = result.scalars().all()
    items: list[ProjectListItem] = []
    for row in rows:
        floor_plan = await _get_floor_plan(row.id, session)
        items.append(
            ProjectListItem(
                id=row.id,
                name=row.name,
                createdAt=row.created_at,
                updatedAt=row.updated_at,
                hasFloorPlan=floor_plan is not None,
            )
        )
    return items


@router.post("", response_model=ProjectModel, status_code=201)
async def create_project(
    body: CreateProjectRequest,
    session: AsyncSession = Depends(get_session),
) -> ProjectModel:
    row = ProjectRow(name=body.name, document=default_document())
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return _to_project_model(row, None)


@router.get("/{project_id}", response_model=ProjectModel)
async def get_project(
    project_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> ProjectModel:
    row = await _get_project_row(project_id, session)
    floor_plan = await _get_floor_plan(project_id, session)
    return _to_project_model(row, floor_plan)


@router.put("/{project_id}/document", response_model=ProjectModel)
async def update_project_document(
    project_id: uuid.UUID,
    body: UpdateProjectDocumentRequest,
    session: AsyncSession = Depends(get_session),
) -> ProjectModel:
    row = await _get_project_row(project_id, session)
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
) -> ProjectModel:
    row = await _get_project_row(project_id, session)
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
) -> FileResponse:
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
