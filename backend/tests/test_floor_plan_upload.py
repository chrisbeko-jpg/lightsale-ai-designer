import io
import uuid
from pathlib import Path

import pytest
from fastapi import UploadFile
from starlette.datastructures import Headers

from app.floor_plan_upload import save_floor_plan_upload

PNG_1X1 = bytes(
    [
        0x89,
        0x50,
        0x4E,
        0x47,
        0x0D,
        0x0A,
        0x1A,
        0x0A,
        0x00,
        0x00,
        0x00,
        0x0D,
        0x49,
        0x48,
        0x44,
        0x52,
        0x00,
        0x00,
        0x00,
        0x01,
        0x00,
        0x00,
        0x00,
        0x01,
        0x08,
        0x06,
        0x00,
        0x00,
        0x00,
        0x1F,
        0x15,
        0xC4,
        0x89,
        0x00,
        0x00,
        0x00,
        0x0A,
        0x49,
        0x44,
        0x41,
        0x54,
        0x78,
        0x9C,
        0x63,
        0x00,
        0x01,
        0x00,
        0x00,
        0x05,
        0x00,
        0x01,
        0x0D,
        0x0A,
        0x2D,
        0xB4,
        0x00,
        0x00,
        0x00,
        0x00,
        0x49,
        0x45,
        0x4E,
        0x44,
        0xAE,
        0x42,
        0x60,
        0x82,
    ]
)


@pytest.mark.asyncio
async def test_save_floor_plan_upload_png(tmp_path: Path):
    upload = UploadFile(
        file=io.BytesIO(PNG_1X1),
        filename="plan.png",
        headers=Headers({"content-type": "image/png"}),
    )
    project_id = uuid.uuid4()
    file_name, mime_type, width_px, height_px, storage_path = (
        await save_floor_plan_upload(upload, tmp_path, project_id)
    )
    assert mime_type == "image/png"
    assert width_px == 1.0
    assert height_px == 1.0
    assert Path(storage_path).exists()
    assert file_name == "plan.png"
