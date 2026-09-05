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
        if "review_decision" not in cols:
            conn.execute(
                text("ALTER TABLE studies ADD COLUMN review_decision VARCHAR(32)")
            )
        if "final_label" not in cols:
            conn.execute(
                text("ALTER TABLE studies ADD COLUMN final_label VARCHAR(64)")
            )
        if "review_note" not in cols:
            conn.execute(text("ALTER TABLE studies ADD COLUMN review_note TEXT"))
        if "reviewed_at" not in cols:
            conn.execute(text("ALTER TABLE studies ADD COLUMN reviewed_at DATETIME"))
