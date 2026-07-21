import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class DesignLibraryProjectRow(Base):
    __tablename__ = "design_library_projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    owner_id: Mapped[str] = mapped_column(String(128), nullable=False, default="local")
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    client_name: Mapped[str | None] = mapped_column(String(300), nullable=True)
    project_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    project_type: Mapped[str] = mapped_column(String(64), nullable=False, default="other")
    location: Mapped[str | None] = mapped_column(String(300), nullable=True)
    designer: Mapped[str] = mapped_column(String(200), nullable=False, default="Lightsale")
    styles: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(64), nullable=False, default="concept")
    approval_status: Mapped[str] = mapped_column(String(64), nullable=False, default="concept")
    searchable_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    normalized_tags: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    reference_quality: Mapped[str | None] = mapped_column(String(64), nullable=True)
    source_type: Mapped[str] = mapped_column(String(64), nullable=False, default="manual")
    extraction_status: Mapped[str] = mapped_column(String(64), nullable=False, default="none")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_by: Mapped[str | None] = mapped_column(String(128), nullable=True)

    files: Mapped[list["DesignLibraryFileRow"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    rooms: Mapped[list["DesignLibraryRoomRow"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    interpretations: Mapped[list["DesignLibraryInterpretationRow"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )


class DesignLibraryFileRow(Base):
    __tablename__ = "design_library_files"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("design_library_projects.id"), nullable=False
    )
    file_name: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(120), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    storage_path: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False, default="other")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    upload_status: Mapped[str] = mapped_column(String(32), nullable=False, default="uploaded")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    project: Mapped[DesignLibraryProjectRow] = relationship(back_populates="files")


class DesignLibraryRoomRow(Base):
    __tablename__ = "design_library_rooms"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("design_library_projects.id"), nullable=False
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    room_type: Mapped[str] = mapped_column(String(64), nullable=False, default="other")
    area_square_metres: Mapped[float | None] = mapped_column(Float, nullable=True)
    length_metres: Mapped[float | None] = mapped_column(Float, nullable=True)
    width_metres: Mapped[float | None] = mapped_column(Float, nullable=True)
    ceiling_height_metres: Mapped[float | None] = mapped_column(Float, nullable=True)
    ceiling_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    target_lux: Mapped[float | None] = mapped_column(Float, nullable=True)
    colour_temperature_kelvin: Mapped[float | None] = mapped_column(Float, nullable=True)
    usage_function: Mapped[str | None] = mapped_column(String(200), nullable=True)
    style: Mapped[str | None] = mapped_column(String(120), nullable=True)
    budget_level: Mapped[str | None] = mapped_column(String(120), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    placement: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    room_interpretation: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    project: Mapped[DesignLibraryProjectRow] = relationship(back_populates="rooms")
    products: Mapped[list["DesignLibraryRoomProductRow"]] = relationship(
        back_populates="room", cascade="all, delete-orphan"
    )


class DesignLibraryRoomProductRow(Base):
    __tablename__ = "design_library_room_products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    room_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("design_library_rooms.id"), nullable=False
    )
    catalog_product_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_manual_historical: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    manual_payload: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    mounting_method: Mapped[str | None] = mapped_column(String(120), nullable=True)
    color: Mapped[str | None] = mapped_column(String(120), nullable=True)
    dimming_method: Mapped[str | None] = mapped_column(String(120), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    room: Mapped[DesignLibraryRoomRow] = relationship(back_populates="products")


class DesignLibraryInterpretationRow(Base):
    __tablename__ = "design_library_interpretations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("design_library_projects.id"), nullable=False
    )
    room_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("design_library_rooms.id"), nullable=True
    )
    content: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    project: Mapped[DesignLibraryProjectRow] = relationship(back_populates="interpretations")


class DesignNoteRow(Base):
    __tablename__ = "design_notes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    owner_id: Mapped[str] = mapped_column(String(128), nullable=False, default="local")
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False, default="other")
    room_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    project_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    rule_text: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(String(32), nullable=False, default="normal")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="concept")
    source: Mapped[str | None] = mapped_column(String(200), nullable=True)
    searchable_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
