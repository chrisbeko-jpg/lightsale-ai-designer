from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models import Base

engine = create_async_engine(settings.database_url, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


async def init_db() -> None:
    from sqlalchemy import text

    async with engine.begin() as conn:
        if settings.enable_postgis:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        await conn.run_sync(Base.metadata.create_all)
        migrations = [
            "ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_id VARCHAR(128)",
            "ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ",
            "ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(128)",
            "ALTER TABLE projects ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMPTZ",
            "UPDATE projects SET owner_id = 'local' WHERE owner_id IS NULL",
        ]
        for statement in migrations:
            await conn.execute(text(statement))
