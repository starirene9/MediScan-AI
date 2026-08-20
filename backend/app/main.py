from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import health, studies
from app.config import settings
from app.db.database import Base, SessionLocal, engine
from app.db.seed import seed_studies
from app.models import entities  # noqa: F401  — register SQLAlchemy models
from app.services.storage_service import ensure_upload_dir


@asynccontextmanager
async def lifespan(_app: FastAPI):
    ensure_upload_dir()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_studies(db)
    finally:
        db.close()
    yield


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(studies.router)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")
