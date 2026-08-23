import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.config import settings

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}

EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


def ensure_upload_dir() -> Path:
    path = Path(settings.upload_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_upload(file: UploadFile) -> str:
    content_type = file.content_type or ""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a JPEG, PNG, WebP, or GIF image.",
        )

    upload_dir = ensure_upload_dir()
    filename = f"{uuid.uuid4().hex}{EXTENSIONS[content_type]}"
    dest = upload_dir / filename
    dest.write_bytes(file.file.read())
    return f"/uploads/{filename}"


def resolve_upload_path(image_url: str) -> Path:
    """Convert API URL `/uploads/abc.png` → disk path for CNN inference."""
    prefix = "/uploads/"
    if not image_url.startswith(prefix):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image URL for inference.",
        )
    return ensure_upload_dir() / image_url.removeprefix(prefix)
