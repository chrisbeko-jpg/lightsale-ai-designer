import re
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

MAX_DESIGN_LIBRARY_FILE_BYTES = 25 * 1024 * 1024

ALLOWED_MIME_TYPES: dict[str, str] = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "text/csv": ".csv",
    "text/plain": ".txt",
}

EXTENSION_MIME = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".csv": "text/csv",
    ".txt": "text/plain",
}


def sanitize_filename(name: str) -> str:
    base = Path(name).name
    cleaned = re.sub(r"[^\w.\- ()]", "_", base)
    return cleaned[:200] if cleaned else "upload.bin"


def resolve_design_library_mime(upload: UploadFile) -> str:
    content_type = (upload.content_type or "").split(";", 1)[0].strip().lower()
    if content_type in ALLOWED_MIME_TYPES:
        return content_type
    filename = (upload.filename or "").lower()
    for ext, mime in EXTENSION_MIME.items():
        if filename.endswith(ext):
            return mime
    return content_type


async def save_design_library_upload(
    upload: UploadFile,
    upload_dir: Path,
    project_id: uuid.UUID,
) -> tuple[str, str, int, str]:
    mime_type = resolve_design_library_mime(upload)
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Bestandstype niet toegestaan. Gebruik PDF, PNG, JPG, DOCX, XLSX, CSV of TXT.",
        )

    content = await upload.read()
    if not content:
        raise HTTPException(status_code=400, detail="Het bestand is leeg.")
    if len(content) > MAX_DESIGN_LIBRARY_FILE_BYTES:
        raise HTTPException(
            status_code=400,
            detail="Bestand is te groot (maximaal 25 MB).",
        )

    extension = ALLOWED_MIME_TYPES[mime_type]
    safe_name = sanitize_filename(upload.filename or f"file{extension}")
    file_id = uuid.uuid4()
    storage_name = f"{project_id}_{file_id}{extension}"
    target_dir = upload_dir / "design-library" / str(project_id)
    target_dir.mkdir(parents=True, exist_ok=True)
    storage_path = target_dir / storage_name
    storage_path.write_bytes(content)

    return safe_name, mime_type, len(content), str(storage_path)
