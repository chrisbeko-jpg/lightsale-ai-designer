import io
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from PIL import Image

ALLOWED_MIME_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "application/pdf": ".pdf",
}


async def save_floor_plan_upload(
    upload: UploadFile,
    upload_dir: Path,
    project_id: uuid.UUID,
) -> tuple[str, str, float, float]:
    if upload.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, PNG, and JPG files are supported",
        )

    content = await upload.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    extension = ALLOWED_MIME_TYPES[upload.content_type]
    file_id = uuid.uuid4()
    filename = f"{project_id}_{file_id}{extension}"
    storage_path = upload_dir / filename
    upload_dir.mkdir(parents=True, exist_ok=True)
    storage_path.write_bytes(content)

    width_px, height_px = await _extract_dimensions(
        content, upload.content_type or "application/octet-stream"
    )

    return (
        upload.filename or f"floor-plan{extension}",
        upload.content_type or "application/octet-stream",
        width_px,
        height_px,
        str(storage_path),
    )


async def _extract_dimensions(
    content: bytes, mime_type: str
) -> tuple[float, float]:
    if mime_type == "application/pdf":
        return _pdf_dimensions(content)
    return _image_dimensions(content)


def _image_dimensions(content: bytes) -> tuple[float, float]:
    with Image.open(io.BytesIO(content)) as image:
        return float(image.width), float(image.height)


def _pdf_dimensions(content: bytes) -> tuple[float, float]:
    try:
        import pypdf
    except ImportError as exc:
        raise HTTPException(
            status_code=500,
            detail="PDF support requires pypdf on the server",
        ) from exc

    reader = pypdf.PdfReader(io.BytesIO(content))
    if len(reader.pages) == 0:
        raise HTTPException(status_code=400, detail="PDF has no pages")

    page = reader.pages[0]
    box = page.mediabox
    # PDF points (1/72 inch); treat as pixel-equivalent canvas units.
    return float(box.width), float(box.height)
