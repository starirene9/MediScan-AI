"""Per-pathology positive thresholds for NIH-14 multi-label inference."""

from __future__ import annotations

import json
from pathlib import Path

from app.ml.pathologies import NIH14_PATHOLOGIES

DEFAULT_THRESHOLD = 0.55
DEFAULT_THRESHOLDS_PATH = (
    Path(__file__).resolve().parent.parent.parent / "models" / "pathology_thresholds.json"
)

_cached: dict[str, float] | None = None
_cached_mtime: float | None = None


def default_thresholds(fallback: float = DEFAULT_THRESHOLD) -> dict[str, float]:
    return {name: fallback for name in NIH14_PATHOLOGIES}


def load_thresholds(
    path: Path | None = None,
    *,
    fallback: float = DEFAULT_THRESHOLD,
) -> dict[str, float]:
    """Load thresholds JSON; missing labels fall back to `fallback`."""
    global _cached, _cached_mtime
    path = path or DEFAULT_THRESHOLDS_PATH
    thresholds = default_thresholds(fallback)

    if not path.is_file():
        return thresholds

    mtime = path.stat().st_mtime
    if _cached is not None and _cached_mtime == mtime:
        return dict(_cached)

    raw = json.loads(path.read_text(encoding="utf-8"))
    data = raw.get("thresholds", raw) if isinstance(raw, dict) else {}
    for name in NIH14_PATHOLOGIES:
        if name in data:
            thresholds[name] = float(data[name])

    _cached = dict(thresholds)
    _cached_mtime = mtime
    return thresholds


def save_thresholds(
    thresholds: dict[str, float],
    path: Path | None = None,
    *,
    meta: dict | None = None,
) -> Path:
    global _cached, _cached_mtime
    path = path or DEFAULT_THRESHOLDS_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "thresholds": {name: round(float(thresholds[name]), 4) for name in NIH14_PATHOLOGIES},
        "meta": meta or {},
    }
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    _cached = None
    _cached_mtime = None
    return path


def threshold_for(name: str, thresholds: dict[str, float] | None = None, fallback: float = DEFAULT_THRESHOLD) -> float:
    table = thresholds if thresholds is not None else load_thresholds(fallback=fallback)
    return float(table.get(name, fallback))
