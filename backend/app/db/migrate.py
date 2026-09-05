"""Lightweight SQLite column add for existing mediscan.db files."""

from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.engine import Engine


def ensure_schema(engine: Engine) -> None:
    if engine.dialect.name != "sqlite":
        return

    with engine.begin() as conn:
        cols = {
            row[1]
            for row in conn.execute(text("PRAGMA table_info(studies)")).fetchall()
        }
        if "prediction_findings" not in cols:
            conn.execute(
                text("ALTER TABLE studies ADD COLUMN prediction_findings TEXT DEFAULT '[]'")
            )
        if "prediction_mode" not in cols:
            conn.execute(
                text("ALTER TABLE studies ADD COLUMN prediction_mode VARCHAR(32) DEFAULT 'nih14'")
            )
