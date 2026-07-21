import json
import logging

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.document_normalize import DEFAULT_OUTPUT_SETTINGS
from app.models import Base

logger = logging.getLogger(__name__)
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

        default_settings_json = json.dumps(DEFAULT_OUTPUT_SETTINGS)
        count_result = await conn.execute(
            text(
                """
                SELECT COUNT(*)::int FROM projects
                WHERE document->'outputSettings' IS NULL
                   OR document->'outputSettings' = 'null'::jsonb
                   OR NOT (document ? 'outputSettings')
                """
            )
        )
        repair_count = count_result.scalar_one()
        if repair_count and repair_count > 0:
            await conn.execute(
                text(
                    """
                    UPDATE projects
                    SET document = jsonb_set(
                      document,
                      '{outputSettings}',
                      CAST(:default_settings AS jsonb),
                      true
                    )
                    WHERE document->'outputSettings' IS NULL
                       OR document->'outputSettings' = 'null'::jsonb
                       OR NOT (document ? 'outputSettings')
                    """
                ),
                {"default_settings": default_settings_json},
            )
            logger.info(
                "Repaired null or missing outputSettings on %s project(s)",
                repair_count,
            )
        await conn.execute(
            text(
                """
                UPDATE projects
                SET document = document #- '{outputSettings,projectName}'
                WHERE document->'outputSettings' ? 'projectName'
                  AND document->'outputSettings'->'projectName' = 'null'::jsonb
                """
            )
        )
