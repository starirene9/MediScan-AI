from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings


def register_frontend(app: FastAPI) -> None:
    """Serve the Vite production build from the same origin as the API."""
    if not settings.serve_frontend:
        return

    static_dir = Path(settings.static_dir)
    if not static_dir.is_dir():
        return

    assets_dir = static_dir / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str) -> FileResponse:
        if full_path.startswith(("api/", "uploads/")):
            raise HTTPException(status_code=404, detail="Not found")

        if full_path:
            candidate = static_dir / full_path
            if candidate.is_file():
                return FileResponse(candidate)

        index = static_dir / "index.html"
        if not index.is_file():
            raise HTTPException(status_code=404, detail="Frontend build not found")
        return FileResponse(index)
