from app.design_library_upload import ALLOWED_MIME_TYPES, sanitize_filename


def test_sanitize_filename_strips_path() -> None:
    assert sanitize_filename("../../secret/plan.pdf") == "plan.pdf"


def test_pdf_mime_allowed() -> None:
    assert "application/pdf" in ALLOWED_MIME_TYPES
