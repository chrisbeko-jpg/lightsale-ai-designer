import json

import logging



from collections.abc import AsyncGenerator



from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine



from app.config import settings

from app.document_normalize import (

    default_output_settings,

    normalize_project_document,

    output_settings_needs_repair,

)

from app.models import Base

import app.design_library_models  # noqa: F401 — register design library tables



logger = logging.getLogger(__name__)

engine = create_async_engine(settings.database_url, echo=False)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False)





async def get_session() -> AsyncGenerator[AsyncSession, None]:

    async with SessionLocal() as session:

        yield session





async def _repair_output_settings(conn) -> None:

    from sqlalchemy import text



    default_settings_json = json.dumps(default_output_settings())

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

    missing_count = count_result.scalar_one() or 0

    if missing_count > 0:

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



    rows = await conn.execute(text("SELECT id, name, document FROM projects"))

    repaired = 0

    for row in rows.mappings():

        document = row["document"]

        if not isinstance(document, dict):

            continue

        if not output_settings_needs_repair(document):

            continue

        fixed = normalize_project_document(document, project_name=row["name"])

        if fixed == document:

            continue

        await conn.execute(

            text(

                """

                UPDATE projects

                SET document = CAST(:document AS jsonb)

                WHERE id = CAST(:id AS uuid)

                """

            ),

            {

                "document": json.dumps(fixed),

                "id": str(row["id"]),

            },

        )

        repaired += 1



    total = missing_count + repaired

    if total > 0:

        logger.info("Repaired outputSettings for %s projects", total)





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



        await _repair_output_settings(conn)

