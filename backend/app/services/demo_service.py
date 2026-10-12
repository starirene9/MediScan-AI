"""Public demo protection: per-client rate limits and periodic data reset."""

from __future__ import annotations

import asyncio
import logging
import shutil
import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, Request, status

from app.config import settings
from app.db.database import SessionLocal
from app.db.seed import build_seed_studies
from app.models.entities import StudyEntity
from app.services.storage_service import ensure_upload_dir

logger = logging.getLogger(__name__)


class RateLimiter:
    """In-memory sliding window keyed by client. Good enough for a single demo container."""

    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def hit(self, key: str, limit: int, window_seconds: int) -> int | None:
        """Record a request; return seconds to wait if the limit is exceeded."""
        now = time.monotonic()
        with self._lock:
            hits = self._hits[key]
            while hits and now - hits[0] >= window_seconds:
                hits.popleft()
            if len(hits) >= limit:
                return max(1, int(window_seconds - (now - hits[0])))
            hits.append(now)
            return None

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


limiter = RateLimiter()


def client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _enforce(request: Request, bucket: str, limit: int, window_seconds: int) -> None:
    if not settings.demo_mode:
        return
    retry_after = limiter.hit(f"{bucket}:{client_key(request)}", limit, window_seconds)
    if retry_after is not None:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Public demo limit reached. Please try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )


def limit_chat(request: Request) -> None:
    _enforce(request, "chat", settings.demo_chat_limit, settings.demo_chat_window_seconds)


def limit_writes(request: Request) -> None:
    _enforce(request, "write", settings.demo_write_limit, settings.demo_write_window_seconds)


def block_in_demo(action: str) -> None:
    if settings.demo_mode:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"{action} is disabled in the public demo.",
        )


def reset_demo_data() -> None:
    """Restore seed studies and remove every uploaded file."""
    db = SessionLocal()
    try:
        db.query(StudyEntity).delete()
        db.add_all(build_seed_studies())
        db.commit()
    finally:
        db.close()

    upload_dir = ensure_upload_dir()
    for path in upload_dir.iterdir():
        if path.name == ".gitkeep":
            continue
        if path.is_dir():
            shutil.rmtree(path, ignore_errors=True)
        else:
            path.unlink(missing_ok=True)
    limiter.reset()


async def run_periodic_reset(interval_minutes: int) -> None:
    while True:
        await asyncio.sleep(interval_minutes * 60)
        try:
            await asyncio.to_thread(reset_demo_data)
            logger.info("Demo data reset")
        except Exception:
            logger.exception("Demo data reset failed")
