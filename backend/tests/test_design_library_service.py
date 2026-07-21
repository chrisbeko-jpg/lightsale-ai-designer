import uuid

from app.design_library_service import (
    build_project_searchable_text,
    default_interpretation_content,
    normalize_interpretation_content,
)
from app.design_library_models import DesignLibraryProjectRow, DesignLibraryRoomRow


def test_normalize_interpretation_never_null_strings() -> None:
    result = normalize_interpretation_content({"designGoal": None, "mainRationale": "Test"})
    assert result["designGoal"] == ""
    assert result["mainRationale"] == "Test"


def test_build_searchable_text_includes_room_and_project_fields() -> None:
    project_id = uuid.uuid4()
    project = DesignLibraryProjectRow(
        id=project_id,
        owner_id="local",
        name="Kantoor Amsterdam",
        project_type="office",
        styles=["functional"],
        searchable_text="",
        normalized_tags=[],
    )
    room = DesignLibraryRoomRow(
        id=uuid.uuid4(),
        project_id=project_id,
        name="Open kantoor",
        room_type="open_office",
        placement={},
    )
    text = build_project_searchable_text(
        project,
        [room],
        [],
        default_interpretation_content(),
    )
    assert "kantoor amsterdam" in text
    assert "open kantoor" in text
